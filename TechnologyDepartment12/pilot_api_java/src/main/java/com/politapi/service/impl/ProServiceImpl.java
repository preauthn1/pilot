package com.politapi.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.politapi.entity.*;
import com.politapi.mapper.*;
import com.politapi.service.ChannelService;
import com.politapi.service.FreeBetService;
import com.politapi.service.ProService;
import com.politapi.service.UserService;
import com.politapi.util.HttpUtil;
import com.politapi.util.LogUtil;
import com.politapi.util.SignUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * 游戏核心服务实现 - 支持两种钱包模式：
 * <ul>
 *   <li>模式1：转发到第三方渠道的接口</li>
 *   <li>模式2：本地钱包直接扣减（walletType=2）</li>
 * </ul>
 */
@Service
public class ProServiceImpl implements ProService {

    private final CallbackGameCodeResolver callbackGameCodeResolver;

    public ProServiceImpl(CallbackGameCodeResolver callbackGameCodeResolver) {
        this.callbackGameCodeResolver = callbackGameCodeResolver;
    }

    @Autowired
    private UserService userService;
    @Autowired
    private ChannelService channelService;
    @Autowired
    private FreeBetService freeBetService;
    @Autowired
    private CoinMapper coinMapper;
    @Autowired
    private MerchantMapper merchantMapper;

    // ==================== 公开接口 ====================

    @Override
    public JSONObject getBalance(Map<String, Object> params) {
        String username = (String) params.get("username");
        String channelId = (String) params.get("channelId");
        if (username == null || channelId == null) {
            return fail("missing params", 1001);
        }

        User user = resolveUser(channelId, username);
        if (user == null || user.getCurrency() == null) {
            return fail("user not found", 2001);
        }

        Channel channel = channelService.getByIdWithMerchant(Long.parseLong(channelId));
        if (channel == null) {
            return fail("channel not found", 2002);
        }

        // 模式2：本地钱包
        if (isWalletType2(channel)) {
            Coin coin = coinMapper.selectOne(new LambdaQueryWrapper<Coin>().eq(Coin::getUserId, user.getId()));
            JSONObject r = ok();
            JSONObject d = new JSONObject();
            d.put("balance", coin != null ? coin.getCoin() : 0);
            r.put("data", d);
            return r;
        }

        // 模式1：转发到第三方
        return forwardGetBalance(params, user, channel);
    }

    @Override
    public JSONObject bet(Map<String, Object> params) {
        String username = (String) params.get("username");
        String refId = (String) params.get("refId");
        String channelId = (String) params.get("channelId");
        long amount = toLong(params.get("amount"));
        if (username == null || refId == null || channelId == null) {
            return fail("missing params", 1001);
        }
        if (amount <= 0) {
            return fail("amount must be positive", 1001);
        }

        User user = resolveUser(channelId, username);
        if (user == null || user.getCurrency() == null) {
            return fail("user not found", 2001);
        }

        Channel channel = channelService.getByIdWithMerchant(Long.parseLong(channelId));
        if (channel == null) {
            return fail("channel not found", 2002);
        }

        // 模式2：本地钱包扣减
        if (isWalletType2(channel)) {
            Coin coin = coinMapper.selectOne(new LambdaQueryWrapper<Coin>()
                    .eq(Coin::getUserId, user.getId()));
            if (coin == null || coin.getCoin() < amount) {
                return fail("insufficient balance", 3001);
            }

            coinMapper.update(null, new UpdateWrapper<Coin>()
                    .eq("user_id", user.getId())
                    .setSql("coin = coin - " + amount));
            Coin updated = coinMapper.selectById(coin.getUserId());
            JSONObject r = ok();
            JSONObject d = new JSONObject();
            d.put("balance", updated.getCoin());
            d.put("orderNo", refId);
            d.put("currency", user.getCurrency());
            r.put("data", d);
            return r;
        }

        // 模式1：转发到第三方
        try {
            prepareExternalWalletParams(params, user, channel);
        } catch (IllegalArgumentException e) {
            return fail(e.getMessage(), 1001);
        }
        // amount 除以100，去掉末尾零（1.00→"1"，1.50→"1.5"），在签名前完成转换
        String betAmount = new BigDecimal(amount).divide(new BigDecimal("100"), 2, RoundingMode.DOWN)
                .stripTrailingZeros().toPlainString();
        params.put("amount", betAmount);
        JSONObject postData = buildPost(params, channel);
        LogUtil.write("bet req:" + postData, "pro-" + channelId, "pro");
        JSONObject ret = HttpUtil.postJson(channel.getNotifyUrl() + "/bet", postData);
        LogUtil.write("bet resp:" + ret, "pro-" + channelId, "pro");
        return scaleResult(ret);
    }

    @Override
    public JSONObject unbet(Map<String, Object> params) {
        String username = (String) params.get("username");
        String refId = (String) params.get("refId");
        String channelId = (String) params.get("channelId");
        long amount = toLong(params.get("amount"));
        if (username == null || refId == null || channelId == null) {
            return fail("missing params", 1001);
        }

        User user = resolveUser(channelId, username);
        if (user == null || user.getCurrency() == null) {
            return fail("user not found", 2001);
        }

        Channel channel = channelService.getByIdWithMerchant(Long.parseLong(channelId));
        if (channel == null) {
            return fail("channel not found", 2002);
        }

        // 模式2：本地钱包退款
        if (isWalletType2(channel)) {
            if (amount > 0) {
                coinMapper.update(null, new UpdateWrapper<Coin>()
                        .eq("user_id", user.getId())
                        .setSql("coin = coin + " + amount));
            }
            Coin coin = coinMapper.selectOne(new LambdaQueryWrapper<Coin>()
                    .eq(Coin::getUserId, user.getId()));
            JSONObject r = ok();
            JSONObject d = new JSONObject();
            d.put("balance", coin != null ? coin.getCoin() : 0);
            r.put("data", d);
            return r;
        }

        // 模式1：转发到第三方
        try {
            prepareExternalWalletParams(params, user, channel);
        } catch (IllegalArgumentException e) {
            return fail(e.getMessage(), 1001);
        }
        params.remove("amount");
        JSONObject postData = buildPost(params, channel);
        LogUtil.write("unbet req:" + postData, "pro-" + channelId, "pro");
        JSONObject ret = HttpUtil.postJson(channel.getNotifyUrl() + "/unbet", postData);
        return scaleResult(ret);
    }

    @Override
    public JSONObject settle(Map<String, Object> params) {
        String username = (String) params.get("username");
        String refId = (String) params.get("refId");
        String channelId = (String) params.get("channelId");
        long rewardAmount = toLong(params.get("rewardAmount"));
        if (username == null || refId == null || channelId == null) {
            return fail("missing params", 1001);
        }

        User user = resolveUser(channelId, username);
        if (user == null || user.getCurrency() == null) {
            return fail("user not found", 2001);
        }

        Channel channel = channelService.getByIdWithMerchant(Long.parseLong(channelId));
        if (channel == null) {
            return fail("channel not found", 2002);
        }

        // 模式2：本地钱包结算
        if (isWalletType2(channel)) {
            if (rewardAmount != 0) {
                coinMapper.update(null, new UpdateWrapper<Coin>()
                        .eq("user_id", user.getId())
                        .setSql("coin = coin + " + rewardAmount));
            }
            Coin coin = coinMapper.selectOne(new LambdaQueryWrapper<Coin>()
                    .eq(Coin::getUserId, user.getId()));
            JSONObject r = ok();
            JSONObject d = new JSONObject();
            d.put("balance", coin != null ? coin.getCoin() : 0);
            r.put("data", d);
            return r;
        }

        // 模式1：转发到第三方。只有未恢复的免费局才附带扣次数时的流水倍数。
        UmsFreeBetLog freeBetUse = freeBetService.findActiveFreeBetUse(user.getId(), Long.parseLong(channelId), refId);
        if (freeBetUse != null) {
            Integer multiple = freeBetUse.getMultiple();
            if (multiple == null || multiple <= 0) {
                return fail("free bet multiple is missing", 1001);
            }
            params.put("multiple", multiple.toString());
        }
        try {
            prepareExternalWalletParams(params, user, channel);
        } catch (IllegalArgumentException e) {
            return fail(e.getMessage(), 1001);
        }
        // rewardAmount 除以100，去掉末尾零（1.00→"1"，1.50→"1.5"），在签名前完成转换
        String settleAmount = new BigDecimal(rewardAmount).divide(new BigDecimal("100"), 2, RoundingMode.DOWN).stripTrailingZeros().toPlainString();
        params.put("rewardAmount", settleAmount);
        JSONObject postData = buildPost(params, channel);
        LogUtil.write("settle req:" + postData, "pro-" + channelId, "pro");
        JSONObject ret = HttpUtil.postJson(channel.getNotifyUrl() + "/settle", postData);
        return scaleResult(ret);
    }

    // ==================== 私有方法 ====================

    /**
     * 判断是否为本地钱包模式（模式2）
     */
    private boolean isWalletType2(Channel channel) {
        Merchant m = merchantMapper.selectById(channel.getMerchantId());
        return m != null && m.getWalletType() == 2;
    }

    private User resolveUser(String channelId, String username) {
        return userService.getUserInfo(Long.parseLong(channelId), username);
    }

    /**
     * 构建带签名的 POST 请求体
     */
    private JSONObject buildPost(Map<String, Object> params, Channel channel) {
        Merchant merchant = merchantMapper.selectById(channel.getMerchantId());
        String secret = (merchant != null && merchant.getSecret() != null) ? merchant.getSecret() : "";
        LogUtil.write("buildPost___secret:" + secret, "pro-" + channel.getId(), "pro");
        String sign = SignUtil.generateSign(params, secret);
        JSONObject d = new JSONObject();
        d.putAll(params);
        d.put("sign", sign);
        return d;
    }

    void prepareExternalWalletParams(Map<String, Object> params, User user, Channel channel) {
        boolean gameCodeProvided = params.containsKey("gameCode") || params.containsKey("game_code");
        String camelGameCode = nonBlankString(params.get("gameCode"));
        String snakeGameCode = nonBlankString(params.get("game_code"));
        String requestedGameCode = camelGameCode != null ? camelGameCode : snakeGameCode;
        if (gameCodeProvided && requestedGameCode == null) {
            throw new IllegalArgumentException("gameCode is invalid");
        }
        String resolvedGameCode = callbackGameCodeResolver.resolve(
                channel, requestedGameCode);
        params.put("appid", "AF");
        params.put("channel", channel.getName());
        params.put("game_code", resolvedGameCode);
        params.put("currency", user.getCurrency());
        params.remove("gameCode");
        params.remove("merchantId");
    }

    private String nonBlankString(Object value) {
        if (value == null) {
            return null;
        }
        String stringValue = value.toString();
        return stringValue.isBlank() ? null : stringValue;
    }

    /**
     * 缩放余额（100 倍），适配不同渠道的余额精度
     */
    private JSONObject scaleResult(JSONObject ret) {
        if (ret != null && ret.getJSONObject("data") != null
                && ret.getJSONObject("data").get("balance") != null) {
            BigDecimal b = new BigDecimal(ret.getJSONObject("data").getString("balance"))
                    .multiply(new BigDecimal("100")).setScale(2, RoundingMode.DOWN);
            ret.getJSONObject("data").put("balance", b.doubleValue());
        } else if (ret != null && ret.get("data") instanceof Number) {
            BigDecimal b = new BigDecimal(ret.getString("data"))
                    .multiply(new BigDecimal("100")).setScale(2, RoundingMode.DOWN);
            ret.put("data", b.doubleValue());
        }
        return ret;
    }

    /**
     * 转发余额查询到第三方渠道
     */
    private JSONObject forwardGetBalance(Map<String, Object> params, User user, Channel channel) {
        try {
            prepareExternalWalletParams(params, user, channel);
        } catch (IllegalArgumentException e) {
            return fail(e.getMessage(), 1001);
        }
        JSONObject postData = buildPost(params, channel);
        JSONObject ret = HttpUtil.postJson(channel.getNotifyUrl() + "/getBalance", postData);
        return scaleResult(ret);
    }

    /**
     * 安全转换为 long 类型
     */
    private long toLong(Object obj) {
        if (obj == null) {
            return 0;
        }
        if (obj instanceof Number) {
            return ((Number) obj).longValue();
        }
        try {
            return Long.parseLong(obj.toString());
        } catch (Exception e) {
            return 0;
        }
    }

    private JSONObject fail(String msg, int code) {
        JSONObject r = new JSONObject();
        r.put("code", code);
        r.put("msg", msg);
        return r;
    }

    private JSONObject ok() {
        JSONObject r = new JSONObject();
        r.put("code", 0);
        r.put("msg", "success");
        return r;
    }
}
