package com.politapi.service.impl;

import com.politapi.entity.GameRecord;
import com.politapi.mapper.GameRecordMapper;
import com.politapi.service.GameRecordService;
import com.politapi.util.DataScopeHelper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 游戏结算记录服务实现
 */
@Service
public class GameRecordServiceImpl implements GameRecordService {

    @Autowired
    private GameRecordMapper gameRecordMapper;

    @Override
    public Map<String, Object> getGameRecordList(GameRecord query) {
        int sqlOffset = query.getSqlOffset();
        int limit = query.getLimit();

        String billingType = StringUtils.defaultIfBlank(query.getBillingType(), null);
        String roundId = StringUtils.defaultIfBlank(query.getRoundId(), null);
        String startAt = StringUtils.defaultIfBlank(query.getStartAt(), null);
        String endAt = StringUtils.defaultIfBlank(query.getEndAt(), null);
        String gameCode = StringUtils.defaultIfBlank(query.getGameCode(), null);

        boolean hasFilter = (billingType != null || roundId != null || startAt != null || gameCode != null);

        java.util.Set<Long> allowedChannelIds = DataScopeHelper.getAllowedChannelIds();

        List<Map<String, Object>> list = gameRecordMapper.getGameRecordList(billingType, roundId, startAt, gameCode, endAt, sqlOffset, limit, allowedChannelIds);

        long total = gameRecordMapper.getGameRecordTotal(billingType, roundId, startAt, gameCode, endAt, allowedChannelIds);

        Map<String, Object> summary;
        if (hasFilter) {
            summary = gameRecordMapper.getFilteredSummary(billingType, roundId, startAt, gameCode, endAt, allowedChannelIds);
        } else {
            summary = gameRecordMapper.getGlobalSummary(gameCode, allowedChannelIds);
        }
        long totalBets = summary != null && summary.get("totalBets") != null
                ? ((Number) summary.get("totalBets")).longValue() : 0L;
        long totalExpenses = summary != null && summary.get("totalExpenses") != null
                ? ((Number) summary.get("totalExpenses")).longValue() : 0L;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", list);
        result.put("total", total);
        result.put("totalWinOrLoss", totalBets - totalExpenses);
        result.put("totalBets", totalBets);
        result.put("totalExpenses", totalExpenses);
        return result;
    }

}
