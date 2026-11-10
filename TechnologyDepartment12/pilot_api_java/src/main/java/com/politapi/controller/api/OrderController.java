package com.politapi.controller.api;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.common.Result;
import com.politapi.dto.request.ChannelSumQueryRequest;
import com.politapi.dto.request.CoinRecordQueryRequest;
import com.politapi.dto.request.TransferOrderQueryRequest;
import com.politapi.entity.*;
import com.politapi.mapper.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * 对外开放 - 订单查询 / 注单记录 / 渠道汇总
 */
@RestController("apiOrderController")
@Tag(name = "订单查询", description = "商户端查询转账订单状态、注单记录、渠道汇总")
public class OrderController {

    @Autowired private ChannelMapper channelMapper;
    @Autowired private CoinLogMapper coinLogMapper;
    @Autowired private CoinRecordMapper coinRecordMapper;
    @Autowired private UserMapper userMapper;
    @Autowired private ChannelReportMapper channelReportMapper;

    public static final int NO_EXIST_CHANNEL = 201;

    /** 转入/转出订单查询 */
    @PostMapping("/order/transfer")
    @Operation(summary = "转账订单查询", description = "查询上分/下分订单的执行状态。返回 status=success 表示已处理。")
    public Result<?> transfer(@RequestBody TransferOrderQueryRequest req) {
        String channelName = req.getChannel();
        String orderId = req.getOrderId();

        if (channelName == null || orderId == null) {
            return Result.fail("参数不完整");
        }

        Channel channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
        if (channel == null) {
            return fail(NO_EXIST_CHANNEL, "渠道不存在");
        }

        CoinLog log = coinLogMapper.selectOne(new LambdaQueryWrapper<CoinLog>()
                .eq(CoinLog::getChannelOrderId, orderId)
                .eq(CoinLog::getChannelId, channel.getId()));
        if (log == null) {
            Map<String, Object> ret = new LinkedHashMap<>();
            ret.put("orderId", orderId);
            ret.put("status", "noExist");
            return Result.ok(ret);
        }

        User user = userMapper.selectById(log.getUserId());
        Map<String, Object> ret = new LinkedHashMap<>();
        ret.put("orderId", log.getChannelOrderId());
        ret.put("username", user != null ? user.getUsername() : "");
        ret.put("coin", log.getCoin());
        ret.put("status", "success");
        ret.put("created", log.getCreatedAt() != null
                ? log.getCreatedAt().atZone(ZoneId.systemDefault()).toEpochSecond() : 0);
        return Result.ok(ret);
    }

    /** 注单记录（投注明细） */
    @PostMapping("/order/getCoinRecord")
    @Operation(summary = "注单记录查询", description = "按时间范围查询投注明细记录。start/end 为 Unix 时间戳（秒）。")
    public Result<?> getCoinRecord(@RequestBody CoinRecordQueryRequest req) {
        String channelName = req.getChannel();
        long start = req.getStart() != null ? req.getStart() : 0;
        long end = req.getEnd() != null ? req.getEnd() : 0;
        String username = req.getUsername();

        if (channelName == null) {
            return Result.fail("渠道不能为空");
        }

        Channel channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
        if (channel == null) {
            return fail(NO_EXIST_CHANNEL, "渠道不存在");
        }

        LambdaQueryWrapper<CoinRecord> qw = new LambdaQueryWrapper<>();
        qw.eq(CoinRecord::getChannelId, channel.getId());
        if (start > 0) {
            qw.ge(CoinRecord::getExpandTime, start);
        }
        if (end > 0) {
            qw.le(CoinRecord::getExpandTime, end);
        }
        qw.ge(CoinRecord::getUserId, 10000L);
        if (username != null && !username.isEmpty()) {
            User u = userMapper.selectOne(new LambdaQueryWrapper<User>()
                    .eq(User::getChannelId, channel.getId()).eq(User::getUsername, username));
            if (u != null) {
                qw.eq(CoinRecord::getUserId, u.getId());
            }
        }
        qw.orderByDesc(CoinRecord::getExpandTime);

        List<CoinRecord> records = coinRecordMapper.selectList(qw);
        List<Map<String, Object>> list = new ArrayList<>();
        for (CoinRecord r : records) {
            Map<String, Object> item = new LinkedHashMap<>();
            User u = userMapper.selectById(r.getUserId());
            item.put("username", u != null ? u.getUsername() : "");
            item.put("channelId", r.getChannelId());
            item.put("betsCoin", r.getBet() != null ? r.getBet() : 0);
            item.put("rewardCoin", r.getPayOut() != null ? r.getPayOut() : 0);
            item.put("expand", r.getExpand() != null ? r.getExpand() : "");
            item.put("gameId", r.getRoundId() != null ? r.getRoundId() : "");
            long expandTs = r.getExpandTime() != null ? r.getExpandTime() : 0;
            item.put("betTime", expandTs);
            item.put("finishTime", expandTs + 5);
            item.put("createdTime", expandTs);
            list.add(item);
        }
        return Result.ok(list);
    }

    /** 渠道定时汇总记录 */
    @PostMapping("/order/getChannelSumRecord")
    @Operation(summary = "渠道汇总记录", description = "查询渠道定时汇总报表。start/end 为 Unix 时间戳（秒）。")
    public Result<?> getChannelSumRecord(@RequestBody ChannelSumQueryRequest req) {
        String channelName = req.getChannel();
        long start = req.getStart() != null ? req.getStart() : 0;
        long end = req.getEnd() != null ? req.getEnd() : 0;

        if (channelName == null) {
            return Result.fail("渠道不能为空");
        }

        Channel channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
        if (channel == null) {
            return fail(NO_EXIST_CHANNEL, "渠道不存在");
        }

        LocalDateTime startTime = LocalDateTime.ofInstant(Instant.ofEpochSecond(start), ZoneId.systemDefault());
        LocalDateTime endTime = LocalDateTime.ofInstant(Instant.ofEpochSecond(end), ZoneId.systemDefault());

        List<ChannelReport> reports = channelReportMapper.selectList(
                new LambdaQueryWrapper<ChannelReport>()
                        .eq(ChannelReport::getChannelId, channel.getId())
                        .ge(ChannelReport::getCreatedAt, startTime.toString())
                        .le(ChannelReport::getCreatedAt, endTime.toString()));

        List<Map<String, Object>> list = new ArrayList<>();
        for (ChannelReport r : reports) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("channel", channelName);
            item.put("betsNumber", r.getBetsNumber() != null ? r.getBetsNumber() : 0);
            item.put("bets", r.getBets() != null ? r.getBets() : 0);
            item.put("payOut", r.getPayout() != null ? r.getPayout() : 0);
            item.put("playerWl", r.getPlayerWl() != null ? r.getPlayerWl() : 0);
            item.put("platformWl", r.getPlatformWl() != null ? r.getPlatformWl() : 0);
            item.put("createdTime", r.getCreatedAt() != null
                    ? parseTimestamp(r.getCreatedAt()) : 0);
            list.add(item);
        }
        return Result.ok(list);
    }

    private Result<?> fail(int code, String msg) { return Result.fail(code, msg); }

    private long toLong(Object val, long def) {
        if (val == null) {
            return def;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        try { return Long.parseLong(val.toString()); } catch (Exception e) { return def; }
    }

    private long parseTimestamp(String dateStr) {
        try {
            return LocalDateTime.parse(dateStr)
                    .atZone(ZoneId.systemDefault()).toEpochSecond();
        } catch (Exception e) { return 0; }
    }
}
