package com.politapi.controller.api;

import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.politapi.common.Result;
import com.politapi.dto.request.AutomaticLoginRequest;
import com.politapi.dto.request.CreateUserRequest;
import com.politapi.dto.request.LoginRequest;
import com.politapi.dto.request.UserExistRequest;
import com.politapi.entity.*;
import com.politapi.mapper.*;
import com.politapi.service.CurrencySettingService;
import com.politapi.service.GameRiskControlService;
import com.politapi.service.UserService;
import com.politapi.service.impl.GameRouteResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * 对外开放 - 用户认证接口（商户端调用）
 */
@RestController("apiAuthController")
@RequestMapping({"/api", ""})
@Tag(name = "用户认证", description = "商户端用户登录、创建、检查接口")
public class AuthController {

    @Autowired
    private UserService userService;
    @Autowired
    private ChannelMapper channelMapper;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private CoinMapper coinMapper;
    @Autowired
    private MerchantMapper merchantMapper;
    @Autowired
    private CoinLogMapper coinLogMapper;
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Autowired
    private ChannelGameConfigMapper channelGameConfigMapper;
    @Autowired
    private GameRiskControlService gameRiskControlService;
    @Autowired
    private CurrencySettingService currencySettingService;

    private final GameRouteResolver gameRouteResolver = new GameRouteResolver();

    public static final int NO_EXIST_CHANNEL = 201;
    public static final int ERROR_SIGN = 101;
    public static final int EXPIRED_SIGN = 102;
    public static final int ERROR_CURRENCY = 108;
    public static final int ERROR_GAME = 107;
    public static final int ERROR_REGISTER = 303;
    public static final int NO_EXIST_USERNAME = 304;
    public static final int REPEAT_USERNAME = 302;
    private static final long GAME_TOKEN_TTL_SECONDS = TimeUnit.MINUTES.toSeconds(5);

    @Value("${redis.prefix}")
    private String redisPrefix;

    /**
     * 登录（首次自动创建用户，返回游戏入口 URL + token）
     */
    @PostMapping("/login")
    @Operation(summary = "用户登录", description = "首次登录自动创建用户，返回游戏入口 URL。用户名+渠道作为唯一标识。")
    public Result<?> login(@RequestBody LoginRequest req) {
        String username = req.getUsername();
        String channelName = req.getChannel();
        String expand = req.getExpand() != null ? req.getExpand() : "";
        String requestedGameCode = req.getGameCode();

        if (username == null || channelName == null) {
            return fail(NO_EXIST_CHANNEL, "渠道和用户名不能为空");
        }

        Channel channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
        if (channel == null) {
            return fail(NO_EXIST_CHANNEL, "渠道不存在");
        }

        // 查找或创建用户
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getChannelId, channel.getId()).eq(User::getUsername, username));
        CurrencySetting currencySetting = resolveLoginCurrency(channel, req.getCurrency());
        if (currencySetting == null) {
            return fail(ERROR_CURRENCY, "该渠道未配置该币种");
        }
        String currency = currencySetting.getCurrency();
        String tag = currencySetting.getTag();
        if (user == null) {
            userService.createUser(String.valueOf(channel.getMerchantId()), username, expand, "", currency, channel.getId());
            user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getChannelId, channel.getId()).eq(User::getUsername, username));
            if (user == null) {
                return fail(ERROR_REGISTER, "创建用户失败");
            }
        } else {
            if (!expand.equals(user.getExpand()) || !currency.equals(user.getCurrency())) {
                User upd = new User();
                upd.setId(user.getId());
                upd.setExpand(expand);
                upd.setCurrency(currency);
                userMapper.updateById(upd);
            }
        }
        if (user.getStatus() != null && user.getStatus() == 1) {
            return fail(ERROR_REGISTER, "该用户已被禁用");
        }

        // 构建游戏 token
        GameRouteResolver.ResolvedGameRoute route = resolveRoute(channel, requestedGameCode);
        if (!route.exists()) {
            return fail(ERROR_GAME, "游戏不存在或维护中");
        }
        if (!gameRiskControlService.isGameEnabled(route.gameCode())) {
            return fail(ERROR_GAME, "游戏维护中");
        }
        String domain = route.domain();
        Merchant merchant = merchantMapper.selectById(channel.getMerchantId());
        String token = UUID.randomUUID().toString().replace("-", "");
        String url = domain + "?token=" + token;

        Map<String, Object> gameParams = new LinkedHashMap<>();
        gameParams.put("username", username);
        gameParams.put("currency", currency);
        gameParams.put("tag", tag);
        gameParams.put("channel", channelName);
        gameParams.put("game_code", route.gameCode());
        gameParams.put("timestamp", System.currentTimeMillis() / 1000);
        stringRedisTemplate.opsForValue().set(redisPrefix + token, JSON.toJSONString(gameParams), GAME_TOKEN_TTL_SECONDS, TimeUnit.SECONDS);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("url", url);
        data.put("username", username);
        data.put("channelId", channel.getId());
        data.put("gameCode", route.gameCode());
        return Result.ok(data);
    }

    /**
     * 检查用户是否存在
     */
    @PostMapping("/userExist")
    @Operation(summary = "检查用户是否存在", description = "根据用户名+渠道检查用户是否已注册")
    public Result<?> userExist(@RequestBody UserExistRequest req) {
        String username = req.getUsername();
        String channelName = req.getChannel();

        Channel channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
        if (channel == null) {
            return fail(NO_EXIST_CHANNEL, "渠道不存在");
        }

        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getChannelId, channel.getId()).eq(User::getUsername, username));
        if (user != null) {
            return Result.ok(Map.of("username", username, "channel", channelName));
        }
        return fail(NO_EXIST_USERNAME, "用户不存在");
    }

    /**
     * 创建用户（商户端调用）
     */
    @PostMapping("/createUser")
    @Operation(summary = "创建用户", description = "商户端创建用户，指定商户ID、渠道ID、币种等信息")
    public Result<?> createUser(@RequestBody CreateUserRequest req) {
        String mId = req.getMerchantId();
        String uname = req.getUsername();
        String expand = req.getExpand() != null ? req.getExpand() : "";
        String ip = req.getIp() != null ? req.getIp() : "";
        Long cId = req.getChannelId() != null ? req.getChannelId() : 0L;

        if (uname == null || uname.isEmpty()) {
            return Result.fail("用户名不能为空");
        }
        Channel channel = cId > 0 ? channelMapper.selectById(cId) : null;
        if (channel == null) {
            return fail(NO_EXIST_CHANNEL, "渠道不存在");
        }
        CurrencySetting currencySetting = currencySettingService.resolveChannelCurrency(cId, req.getCurrency());
        if (currencySetting == null) {
            return fail(ERROR_CURRENCY, "该渠道未配置该币种");
        }

        User exist = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getChannelId, cId).eq(User::getUsername, uname));
        if (exist != null) {
            return fail(REPEAT_USERNAME, "用户名已存在");
        }

        boolean ok = userService.createUser(mId, uname, expand, ip, currencySetting.getCurrency(), cId);
        return ok ? Result.ok() : Result.fail("创建失败");
    }

    /**
     * 自动登录（自动创建用户+上分+登录）
     */
    @PostMapping("/automaticLogin")
    @Operation(summary = "自动登录", description = "无需提前创建用户。无用户名则自动生成，自动上分（默认1000000分），返回游戏链接。")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> automaticLogin(@RequestBody AutomaticLoginRequest req) {
        String username = req.getUsername();
        String channel = req.getChannel();
        Long money = req.getMoney() != null ? req.getMoney() : 1000000L;
        String expand = req.getExpand() != null ? req.getExpand() : "";

        if (username == null || username.isEmpty()) {
            username = "U" + System.currentTimeMillis();
        }

        Channel ch = hasText(channel)
                ? channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channel))
                : null;
        if (ch == null) {
            return fail(NO_EXIST_CHANNEL, "渠道不存在");
        }
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getChannelId, ch.getId()).eq(User::getUsername, username));
        CurrencySetting currencySetting = resolveLoginCurrency(ch, req.getCurrency());
        if (currencySetting == null) {
            return fail(ERROR_CURRENCY, "该渠道未配置该币种");
        }
        String currency = currencySetting.getCurrency();

        // 如果用户不存在，自动创建并上分
        if (user == null) {
            userService.createUser(String.valueOf(ch.getMerchantId()), username, expand, "", currency, ch.getId());
            // 上分
            user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                    .eq(User::getChannelId, ch.getId()).eq(User::getUsername, username));
            if (user != null && money > 0) {
                coinMapper.update(null, new UpdateWrapper<Coin>()
                        .eq("user_id", user.getId())
                        .setSql("coin = IFNULL(coin,0) + " + money));
                CoinLog log = new CoinLog();
                log.setOrderId("O" + System.currentTimeMillis() + user.getId());
                log.setChannelOrderId("AUTO" + System.currentTimeMillis());
                log.setUserId(user.getId());
                log.setChannelId(ch.getId());
                log.setCoin(money);
                log.setCurrency(currency);
                log.setType(1);
                coinLogMapper.insert(log);
            }
        }

        LoginRequest loginReq = new LoginRequest();
        loginReq.setUsername(username);
        loginReq.setChannel(channel);
        loginReq.setCurrency(currency);
        loginReq.setExpand(expand);
        loginReq.setGameCode(req.getGameCode());
        return login(loginReq);
    }

    private GameRouteResolver.ResolvedGameRoute resolveRoute(Channel channel, String requestedGameCode) {
        String codeForLookup = hasText(requestedGameCode) ? requestedGameCode : channel.getGameCode();
        ChannelGameConfig mapping = null;
        if (hasText(codeForLookup)) {
            mapping = channelGameConfigMapper.selectOne(
                    new LambdaQueryWrapper<ChannelGameConfig>()
                            .eq(ChannelGameConfig::getChannelId, channel.getId())
                            .eq(ChannelGameConfig::getGameCode, normalizeGameCode(codeForLookup))
                            .eq(ChannelGameConfig::getStatus, 1)
                            .last("LIMIT 1"));
        }
        return gameRouteResolver.resolve(channel, requestedGameCode, mapping);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    /**
     * 渠道币种是当前游戏积分的展示标识，旧用户保存的币种不应阻断登录。
     */
    private CurrencySetting resolveLoginCurrency(Channel channel, String requestedCurrency) {
        CurrencySetting currencySetting = currencySettingService.resolveChannelCurrency(channel.getId(), requestedCurrency);
        if (currencySetting == null && hasText(requestedCurrency)) {
            currencySetting = currencySettingService.resolveChannelCurrency(channel.getId(), null);
        }
        return currencySetting;
    }

    private String normalizeGameCode(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private Result<?> fail(int code, String msg) {
        return Result.fail(code, msg);
    }
}
