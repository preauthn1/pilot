package com.politapi.controller.api;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.politapi.common.Result;
import com.politapi.dto.request.BalanceQueryRequest;
import com.politapi.dto.request.TransferInRequest;
import com.politapi.dto.request.TransferOutRequest;
import com.politapi.entity.*;
import com.politapi.mapper.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 对外开放 - 转账（上分/下分）接口
 */
@RestController("apiTransferController")
@Tag(name = "转账", description = "商户端上分（转入）/下分（转出）/查询余额接口")
public class TransferController {

    @Autowired private ChannelMapper channelMapper;
    @Autowired private UserMapper userMapper;
    @Autowired private CoinMapper coinMapper;
    @Autowired private CoinLogMapper coinLogMapper;

    public static final int TRANSFER_IN = 1;
    public static final int TRANSFER_OUT = 2;
    public static final int ERR_SIGN = 101;
    public static final int EXPIRED_SIGN = 102;
    public static final int ERR_FREQUENTLY = 103;
    public static final int ERR_UNIT = 104;
    public static final int ERR_ORDER_REPEAT = 105;
    public static final int NO_EXIST_CHANNEL = 201;
    public static final int CHANNEL_AMT_NOT_ENOUGH = 202;
    public static final int NO_EXIST_USERNAME = 304;
    public static final int USER_IN_GAME = 305;
    public static final int ERR_ADD_COIN = 306;
    public static final int USER_AMT_NOT_ENOUGH = 307;
    public static final int ERR_REDUCE_COIN = 308;

    // ==================== 转入（存款/上分） ====================

    @PostMapping("/transfer/in")
    @Transactional(rollbackFor = Exception.class)
    @Operation(summary = "上分（转入）", description = "从渠道余额扣款，加至用户余额。orderId 用作幂等键，重复提交返回 code 105。")
    public Result<?> transferIn(@RequestBody TransferInRequest req) {
        String username = req.getUsername();
        String channelName = req.getChannel();
        String currency = req.getCurrency();
        Long money = req.getMoney() != null ? req.getMoney() : 0L;
        String orderId = req.getOrderId();
        String sign = req.getSign();

        if (username == null || channelName == null || money == null || orderId == null) {
            return Result.fail("参数不完整");
        }
        if (money <= 0) {
            return fail(ERR_UNIT, "金额必须大于0");
        }

        // 防重复订单
        CoinLog dup = coinLogMapper.selectOne(new LambdaQueryWrapper<CoinLog>()
                .eq(CoinLog::getChannelOrderId, orderId));
        if (dup != null) {
            return fail(ERR_ORDER_REPEAT, "订单号重复");
        }

        // 渠道校验
        Channel channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
        if (channel == null) {
            return fail(NO_EXIST_CHANNEL, "渠道不存在");
        }

        // 用户
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getChannelId, channel.getId()).eq(User::getUsername, username));
        if (user == null) {
            return fail(NO_EXIST_USERNAME, "用户不存在");
        }

        // 检查是否锁定（游戏中）
        Coin coin = coinMapper.selectById(user.getId());
        if (coin != null && coin.getIsLock() == 1) {
            return fail(USER_IN_GAME, "玩家正在游戏中");
        }

        // 检查渠道余额
        Long channelAmount = channelMapper.selectById(channel.getId()).getAmount();
        if (channelAmount == null || channelAmount < money) {
            return fail(CHANNEL_AMT_NOT_ENOUGH, "渠道余额不足");
        }

        // 扣渠道额度
        channelMapper.update(null, new UpdateWrapper<Channel>()
                .eq("id", channel.getId()).ge("amount", money)
                .setSql("amount = amount - " + money));

        // 加用户金币
        if (coin == null) {
            coin = new Coin();
            coin.setUserId(user.getId());
            coin.setCoin(money);
            coin.setIsLock(0);
            coinMapper.insert(coin);
        } else {
            coinMapper.update(null, new UpdateWrapper<Coin>()
                    .eq("user_id", user.getId()).setSql("coin = coin + " + money));
        }

        // 写日志
        CoinLog log = new CoinLog();
        log.setOrderId("O" + System.currentTimeMillis() + user.getId());
        log.setChannelOrderId(orderId);
        log.setUserId(user.getId());
        log.setChannelId(channel.getId());
        log.setCoin(money);
        log.setCurrency(currency);
        log.setType(TRANSFER_IN);
        coinLogMapper.insert(log);

        return Result.ok();
    }

    // ==================== 转出（取款/下分） ====================

    @PostMapping("/transfer/out")
    @Transactional(rollbackFor = Exception.class)
    @Operation(summary = "下分（转出）", description = "从用户余额扣款，加回渠道余额。设置 isFull=1 可全额转出。")
    public Result<?> transferOut(@RequestBody TransferOutRequest req) {
        String username = req.getUsername();
        String channelName = req.getChannel();
        String currency = req.getCurrency();
        Long money = req.getMoney() != null ? req.getMoney() : 0L;
        String orderId = req.getOrderId();
        boolean isFull = req.getIsFull() != null && req.getIsFull() == 1;

        if (username == null || channelName == null || orderId == null) {
            return Result.fail("参数不完整");
        }

        CoinLog dup = coinLogMapper.selectOne(new LambdaQueryWrapper<CoinLog>()
                .eq(CoinLog::getChannelOrderId, orderId));
        if (dup != null) {
            return fail(ERR_ORDER_REPEAT, "订单号重复");
        }

        Channel channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
        if (channel == null) {
            return fail(NO_EXIST_CHANNEL, "渠道不存在");
        }

        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getChannelId, channel.getId()).eq(User::getUsername, username));
        if (user == null) {
            return fail(NO_EXIST_USERNAME, "用户不存在");
        }

        Coin coin = coinMapper.selectById(user.getId());
        if (coin == null || coin.getCoin() <= 0) {
            return fail(USER_AMT_NOT_ENOUGH, "余额不足");
        }
        if (coin.getIsLock() == 1) {
            return fail(USER_IN_GAME, "玩家正在游戏中");
        }

        if (isFull) {
            money = coin.getCoin();
        }
        else if (money <= 0 || coin.getCoin() < money) {
            return fail(USER_AMT_NOT_ENOUGH, "余额不足");
        }

        coinMapper.update(null, new UpdateWrapper<Coin>()
                .eq("user_id", user.getId()).ge("coin", money)
                .setSql("coin = coin - " + money));

        channelMapper.update(null, new UpdateWrapper<Channel>()
                .eq("id", channel.getId()).setSql("amount = IFNULL(amount,0) + " + money));

        CoinLog log = new CoinLog();
        log.setOrderId("O" + System.currentTimeMillis() + user.getId());
        log.setChannelOrderId(orderId);
        log.setUserId(user.getId());
        log.setChannelId(channel.getId());
        log.setCoin(money);
        log.setCurrency(currency);
        log.setType(TRANSFER_OUT);
        coinLogMapper.insert(log);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("coin", money);
        return Result.ok(data);
    }

    // ==================== 查询余额 ====================

    @PostMapping("/transfer/getUserAmount")
    @Operation(summary = "查询用户余额", description = "查询指定用户在指定渠道下的当前余额（单位：分）")
    public Result<?> getUserAmount(@RequestBody BalanceQueryRequest req) {
        String username = req.getUsername();
        String channelName = req.getChannel();

        if (username == null || channelName == null) {
            return Result.fail("参数不完整");
        }

        Channel channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
        if (channel == null) {
            return fail(NO_EXIST_CHANNEL, "渠道不存在");
        }

        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getChannelId, channel.getId()).eq(User::getUsername, username));
        if (user == null) {
            return fail(NO_EXIST_USERNAME, "用户不存在");
        }

        Coin coin = coinMapper.selectById(user.getId());
        long amount = coin != null ? coin.getCoin() : 0L;
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("amount", amount);
        return Result.ok(data);
    }

    private Result<?> fail(int code, String msg) {
        return Result.fail(code, msg);
    }
}
