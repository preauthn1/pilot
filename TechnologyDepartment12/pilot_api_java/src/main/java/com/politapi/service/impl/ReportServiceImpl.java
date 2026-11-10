package com.politapi.service.impl;

import com.politapi.mapper.ChannelReportMapper;
import com.politapi.mapper.CoinRecordMapper;
import com.politapi.service.ReportService;
import com.politapi.util.DataScopeHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 数据报表服务实现
 */
@Service
public class ReportServiceImpl implements ReportService {

    @Autowired
    private ChannelReportMapper channelReportMapper;
    @Autowired
    private CoinRecordMapper coinRecordMapper;

    @Override
    public Map<String, Object> getMerchantReportList(Map<String, Object> params) {
        return getSnapshotReportList(params, "merchant", 10);
    }

    @Override
    public Map<String, Object> getChannelReportList(Map<String, Object> params) {
        return getSnapshotReportList(params, "channel", 300);
    }

    @Override
    public Map<String, Object> getRealtimeChannelReport(Map<String, Object> params) {
        String channelId = (String) params.get("channel_id");
        if (channelId == null || channelId.isEmpty()) {
            throw new IllegalArgumentException("请选择渠道");
        }

        long cid = Long.parseLong(channelId);
        Set<Long> allowedChannels = DataScopeHelper.getAllowedChannelIds();
        if (allowedChannels != null && !allowedChannels.contains(cid)) {
            throw new IllegalArgumentException("无权查看该渠道数据");
        }

        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = Math.max(toLong(params.get("limit"), 10), 1);
        long offsetRows = (page - 1) * limit;
        String tag = (String) params.get("tag");
        String gameCode = (String) params.get("game_code");
        String startAt = (String) params.get("start_at");
        String endAt = (String) params.get("end_at");

        List<Map<String, Object>> list = coinRecordMapper.realtimeChannelReport(
                cid, tag, gameCode, startAt, endAt, offsetRows, limit);
        long total = coinRecordMapper.realtimeChannelReportTotal(cid, tag, gameCode, startAt, endAt);
        Map<String, Object> summary = coinRecordMapper.realtimeChannelSummary(cid, tag, gameCode, startAt, endAt);
        long totalBetsNumber = coinRecordMapper.realtimeChannelBetsNumber(cid, tag, gameCode, startAt, endAt);

        for (Map<String, Object> item : list) {
            Object betsNumber = firstPresent(item, "betsNumber", "betsnumber", "bets_number");
            item.put("betsNumber", toLong(betsNumber, 0));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", list);
        result.put("total", total);
        result.put("totalBetsNumber", totalBetsNumber);
        result.put("totalWinLows", valueOrZero(summary, "platformWl"));
        result.put("totalBets", valueOrZero(summary, "bets"));
        result.put("totalPayOut", valueOrZero(summary, "payOut"));
        result.put("totalPlayersWinLows", valueOrZero(summary, "playerWl"));
        return result;
    }

    private Object firstPresent(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            if (map.containsKey(key)) {
                return map.get(key);
            }
        }
        return null;
    }

    @Override
    public Map<String, Object> getDailyReportList(Map<String, Object> params) {
        return getSnapshotReportList(params, "daily", 10);
    }

    private Map<String, Object> getSnapshotReportList(Map<String, Object> params, String grain, long defaultLimit) {
        Map<String, Object> queryParams = buildReportQueryParams(params, defaultLimit);
        queryParams.put("grain", grain);

        List<Map<String, Object>> list = channelReportMapper.selectReportList(queryParams);
        Map<String, Object> summary = channelReportMapper.sumReportList(queryParams);

        Map<String, Object> result = buildSummaryResult(summary);
        result.put("list", list);
        result.put("total", channelReportMapper.countReportList(queryParams));
        return result;
    }

    private Map<String, Object> buildReportQueryParams(Map<String, Object> params, long defaultLimit) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), defaultLimit);

        Map<String, Object> queryParams = new LinkedHashMap<>(params);
        queryParams.put("offset", page);
        queryParams.put("limit", limit);
        queryParams.put("offsetRows", (page - 1) * limit);

        Object channelId = queryParams.get("channel_id");
        Set<Long> allowedChannels = DataScopeHelper.getAllowedChannelIds();
        if (allowedChannels != null) {
            if (allowedChannels.isEmpty()) {
                queryParams.put("channel_id", -1L);
            } else if (channelId != null && !channelId.toString().isEmpty()) {
                long cid = Long.parseLong(channelId.toString());
                if (!allowedChannels.contains(cid)) {
                    queryParams.put("channel_id", -1L);
                }
            } else {
                queryParams.put("allowedChannelIds", allowedChannels);
            }
        }

        return queryParams;
    }

    private Map<String, Object> buildSummaryResult(Map<String, Object> summary) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalWinOrLoss", valueOrZero(summary, "totalWinOrLoss"));
        result.put("totalBets", valueOrZero(summary, "totalBets"));
        result.put("totalPayOut", valueOrZero(summary, "totalPayOut"));
        result.put("totalPlayerWinOrLoss", valueOrZero(summary, "totalPlayerWinOrLoss"));
        return result;
    }

    private Object valueOrZero(Map<String, Object> map, String key) {
        if (map == null || map.get(key) == null) {
            return 0L;
        }
        return map.get(key);
    }

    private long toLong(Object val, long defaultVal) {
        if (val == null) {
            return defaultVal;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        try {
            return Long.parseLong(val.toString());
        } catch (Exception e) {
            return defaultVal;
        }
    }
}
