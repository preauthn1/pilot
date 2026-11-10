package com.politapi.service.impl;

import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.common.Result;
import com.politapi.entity.*;
import com.politapi.mapper.*;
import com.politapi.service.FreeBetService;
import com.politapi.service.GameServerConfigService;
import com.politapi.service.GameRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;

/**
 * 游戏服务器配置 - 对应 PHP ServerConfigController::getServerConfig
 */
@Service
public class GameServerConfigServiceImpl implements GameServerConfigService {

    @Autowired private StringRedisTemplate stringRedisTemplate;
    @Autowired private ChannelMapper channelMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private ServerConfigMapper serverConfigMapper;
    @Autowired private GameSettingMapper gameSettingMapper;
    @Autowired private GameRuleService gameRuleService;
    @Autowired private ChannelGameConfigMapper channelGameConfigMapper;
    @Autowired private GameRiskControlMapper gameRiskControlMapper;
    @Autowired private UserMapper userMapper;
    @Autowired private FreeBetService freeBetService;

    private final GameRouteResolver gameRouteResolver = new GameRouteResolver();

    /**
     * PHP Redis key 前缀（对应 PHP database.php REDIS_PREFIX 配置）
     */
    @Value("${redis.prefix}")
    private String redisPrefix;

    /**
     * 获取游戏服务器配置（含 WebSocket token 生成）
     * 对应 PHP ServerConfigController::getServerConfig
     */
    @Override
    public Result<Map<String, Object>> getServerConfig(Map<String, Object> params) {
        String token = (String) params.get("token");
        if (token == null || token.isEmpty()) {
            return Result.fail("token 不能为空");
        }

        // 1. 从 Redis 验证临时 token（加 PHP 前缀，匹配 PHP 存储的 key）
        String redisJson = stringRedisTemplate.opsForValue().get(redisPrefix + token);
        if (redisJson == null || redisJson.isEmpty()) {
            return Result.fail(ERROR_TOKEN, "Login timed out, please log in again");
        }

        Map<String, Object> data;
        try {
            data = JSON.parseObject(redisJson);
        } catch (Exception e) {
            return Result.fail(ERROR_TOKEN, "Login timed out, please log in again");
        }

        String channelName = (String) data.get("channel");
        if (channelName == null || channelName.isEmpty()) {
            return Result.fail(NO_EXIST_CHANNEL, "渠道不存在");
        }

        // 2. 查找渠道
        Channel channel = channelMapper.selectOne(
                new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
        if (channel == null) {
            return Result.fail(NO_EXIST_CHANNEL, "渠道不存在");
        }

        Long channelId = channel.getId();
        Long merchantId = channel.getMerchantId();
        String requestedGameCode = getString(data, "game_code");
        if (requestedGameCode.isEmpty()) {
            requestedGameCode = getString(data, "gameCode");
        }
        GameRouteResolver.ResolvedGameRoute route = resolveRoute(channel, requestedGameCode);
        if (!route.exists()) {
            return Result.fail(107, "游戏不存在或维护中");
        }

        // 3. 获取商户（secret 在商户表）
        Merchant merchant = merchantMapper.selectById(merchantId);
        if (merchant == null || merchant.getSecret() == null || merchant.getSecret().isEmpty()) {
            return Result.fail(NO_EXIST_CHANNEL, "渠道不存在");
        }

        // 4. 获取服务器配置（cms_server_config）
        ServerConfig serverConfig = selectServerConfig(channelId, route);
        if (serverConfig == null) {
            return Result.fail("渠道已维护，请联系服务方!");
        }

        // 5. 获取游戏设置
        GameSetting gameSetting = selectGameSetting(channelId, route);
        if (gameSetting == null) {
            return Result.fail("渠道已维护，请联系服务方!");
        }

        // 6. 构建 server 对象
        Map<String, Object> server = new LinkedHashMap<>();
        server.put("protocol", serverConfig.getProtocol());
        server.put("address", serverConfig.getAddress());

        // 7. 构建 game 对象（amplitude / 100）
        Map<String, Object> game = new LinkedHashMap<>();
        game.put("id", gameSetting.getId());
        game.put("initialBet", formatBetAmount(route.gameCode(), gameSetting.getInitialBet()));
        game.put("btnBet", gameSetting.getBtnBet());
        game.put("amplitude", (gameSetting.getAmplitude() != null ? gameSetting.getAmplitude().doubleValue() / 100 : 0));
        game.put("betMin", formatBetAmount(route.gameCode(), gameSetting.getBetMin()));
        game.put("betMax", formatBetAmount(route.gameCode(), gameSetting.getBetMax()));
        game.put("settlementMin", gameSetting.getSettlementMin());
        game.put("settlementMax", gameSetting.getSettlementMax());
        game.put("channel", gameSetting.getChannel());
        game.put("ruleContent", gameRuleService.getRuleContent(route.gameCode()));
        game.put("system", gameSetting.getSystem());
        game.put("freeBetEnabled", gameSetting.getFreeBetEnabled() != null ? gameSetting.getFreeBetEnabled() : 1);
        game.put("freeBetAmount", gameSetting.getFreeBetAmount() != null ? gameSetting.getFreeBetAmount() : 100L);

        GameRiskControl globalRiskControl = selectGlobalRiskControl(route.gameCode());
        if (globalRiskControl != null && globalRiskControl.getAmplitude() != null) {
            game.put("amplitude", globalRiskControl.getAmplitude().doubleValue() / 100);
        }
        if (hasCompleteBetConfig(globalRiskControl)) {
            game.put("initialBet", formatBetAmount(route.gameCode(), globalRiskControl.getInitialBet()));
            game.put("btnBet", globalRiskControl.getBtnBet());
            game.put("betMin", formatBetAmount(route.gameCode(), globalRiskControl.getBetMin()));
            game.put("betMax", formatBetAmount(route.gameCode(), globalRiskControl.getBetMax()));
        }

        // 8. 查找用户（用于 WS token 的 userId）
        String username = (String) data.get("username");
        Long userId = null;
        if (username != null) {
            User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                    .eq(User::getUsername, username)
                    .eq(User::getChannelId, channelId));
            if (user != null) {
                userId = user.getId();
            }
        }

        // 8.5 查询用户剩余免费次数
        int freeBetRemain = 0;
        if (userId != null) {
            try {
                freeBetRemain = freeBetService.getRemainCount(userId, channelId, route.gameCode());
            } catch (Exception e) {
                // freeBet 查询失败不影响主流程，回退为 0
                freeBetRemain = 0;
            }
        }
        game.put("freeBetRemain", freeBetRemain);

        // 9. 生成 AES-256-CTR token（与 PHP openssl_encrypt 兼容）
        String wsToken = generateWsToken(serverConfig.getSecret(), userId, route.gameCode());

        // 10. 组装返回数据
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("server", server);
        result.put("skip_url", merchant.getSkipUrl() != null ? merchant.getSkipUrl() : "");
        result.put("game", game);
        result.put("token", wsToken);
        result.put("currency", data.getOrDefault("currency", ""));
        result.put("tag", data.getOrDefault("tag", ""));
        result.put("game_code", route.gameCode());

        return Result.ok(result);
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

    private ServerConfig selectServerConfig(Long channelId, GameRouteResolver.ResolvedGameRoute route) {
        if (route.serverConfigId() != null) {
            ServerConfig config = serverConfigMapper.selectById(route.serverConfigId());
            if (config != null && config.getStatus() != null && config.getStatus() == 1) {
                return config;
            }
            return null;
        }
        return serverConfigMapper.selectOne(
                new LambdaQueryWrapper<ServerConfig>()
                        .eq(ServerConfig::getStatus, 1)
                        .eq(ServerConfig::getChannel, channelId));
    }

    private GameSetting selectGameSetting(Long channelId, GameRouteResolver.ResolvedGameRoute route) {
        if (route.gameSettingId() != null) {
            return gameSettingMapper.selectById(route.gameSettingId());
        }
        return gameSettingMapper.selectOne(
                new LambdaQueryWrapper<GameSetting>().eq(GameSetting::getChannel, channelId));
    }

    private GameRiskControl selectGlobalRiskControl(String gameCode) {
        return gameRiskControlMapper.selectOne(new LambdaQueryWrapper<GameRiskControl>()
                .eq(GameRiskControl::getGameCode, normalizeGameCode(gameCode))
                .eq(GameRiskControl::getStatus, 1)
                .isNull(GameRiskControl::getDeletedAt)
                .last("LIMIT 1"));
    }

    private boolean hasCompleteBetConfig(GameRiskControl riskControl) {
        return riskControl != null
                && riskControl.getInitialBet() != null
                && riskControl.getBtnBet() != null
                && !riskControl.getBtnBet().isBlank()
                && riskControl.getBetMin() != null
                && riskControl.getBetMax() != null;
    }

    private Number formatBetAmount(String gameCode, Long amountInFen) {
        if (amountInFen == null) {
            return null;
        }
        if (isYuanUnitGame(gameCode)) {
            return amountInFen / 100.0;
        }
        return amountInFen;
    }

    private boolean isYuanUnitGame(String gameCode) {
        return normalizeGameCode(gameCode).contains("chicken");
    }

    private String getString(Map<String, Object> data, String key) {
        Object value = data.get(key);
        return value == null ? "" : value.toString();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String normalizeGameCode(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * 生成 WebSocket 连接 token
     * v2 格式：v2:ivHex:cipherHex:macHex，其中 HMAC-SHA256 覆盖前三段。
     * tokenStr: 毫秒时间戳 | userId | 随机数 | 游戏代码
     */
    private String generateWsToken(String secret, Long userId, String gameCode) {
        byte[] iv = new byte[16];
        new SecureRandom().nextBytes(iv);
        return generateWsToken(secret, userId, gameCode, System.currentTimeMillis(),
                new SecureRandom().nextInt(10000), iv);
    }

    static String generateWsToken(String secret, Long userId, String gameCode,
                                  long timestamp, int random, byte[] iv) {
        try {
            String tokenStr = buildTokenPlaintext(timestamp, userId, random, gameCode);

            byte[] key = Base64.getDecoder().decode(secret);

            Cipher cipher = Cipher.getInstance("AES/CTR/NoPadding");
            SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
            byte[] encrypted = cipher.doFinal(tokenStr.getBytes(StandardCharsets.UTF_8));

            String signed = "v2:" + bytesToHex(iv) + ":" + bytesToHex(encrypted);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update("pilot-token-mac".getBytes(StandardCharsets.UTF_8));
            byte[] macKey = digest.digest(key);
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(macKey, "HmacSHA256"));
            byte[] signature = mac.doFinal(signed.getBytes(StandardCharsets.US_ASCII));
            return signed + ":" + bytesToHex(signature);
        } catch (Exception e) {
            throw new RuntimeException("生成 token 失败", e);
        }
    }

    static String buildTokenPlaintext(long timestamp, Long userId, int random, String gameCode) {
        String normalizedGameCode = gameCode == null ? "" : gameCode.trim().toLowerCase(Locale.ROOT);
        return timestamp + "|" + (userId != null ? userId : 0) + "|" + random + "|" + normalizedGameCode;
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
