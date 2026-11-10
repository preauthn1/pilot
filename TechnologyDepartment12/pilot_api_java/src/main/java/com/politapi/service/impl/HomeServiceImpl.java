package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.entity.CurrencySetting;
import com.politapi.mapper.CoinRecordMapper;
import com.politapi.mapper.CurrencySettingMapper;
import com.politapi.service.HomeService;
import com.politapi.util.DataScopeHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

/**
 * 首页仪表盘服务实现
 */
@Service
public class HomeServiceImpl implements HomeService {

    @Autowired
    private CoinRecordMapper coinRecordMapper;
    @Autowired
    private CurrencySettingMapper currencySettingMapper;

    /**
     * 获取首页仪表盘数据（按币种分组统计今日/全量投注、派彩、盈亏、人数）
     * <p>
     * 返回结构:
     * <pre>
     * {
     *   recharge:  { tag: { todayBets: 今日投注额, totalBets: 全量投注额 } }
     *   prize:     { tag: { todayPayOut: 今日派彩额, totalPayOut: 全量派彩额 } }
     *   winLost:   { tag: { todayWinLows: 今日盈亏, totalWinLows: 全量盈亏 } }
     *   BetsNums:  { tag: { todayBetsNum: 今日投注人数, totalBetsNum: 全量投注人数 } }
     * }
     * </pre>
     */
    @Override
    public Map<String, Object> getHomeList() {
        // 今日时间范围
        LocalDate today = LocalDate.now();
        String start = today + " 00:00:00";
        String end = today.plusDays(1) + " 00:00:00";

        // 获取所有币种
        Set<Long> allowedChannelIds = DataScopeHelper.getAllowedChannelIds();
        LambdaQueryWrapper<CurrencySetting> currencyQuery = new LambdaQueryWrapper<>();
        if (allowedChannelIds != null) {
            currencyQuery.in(CurrencySetting::getChannelId, allowedChannelIds);
        }
        List<CurrencySetting> currencies = currencySettingMapper.selectList(currencyQuery);
        Set<String> currencyTags = new LinkedHashSet<>();
        for (CurrencySetting currency : currencies) {
            if (currency.getTag() != null && !currency.getTag().isEmpty()) {
                currencyTags.add(currency.getTag());
            }
        }

        // 四个维度统计：充值(recharge)、派彩(prize)、盈亏(winLost)、投注人数(betsNums)
        Map<String, Object> recharge = new LinkedHashMap<>();
        Map<String, Object> prize = new LinkedHashMap<>();
        Map<String, Object> winLost = new LinkedHashMap<>();
        Map<String, Object> betsNums = new LinkedHashMap<>();

        // 按币种 tag 逐个聚合
        for (String tag : currencyTags) {

            // 全量聚合 & 今日聚合（bet=投注额, payOut=派彩额, winLows=盈亏）
            Map<String, Object> total = coinRecordMapper.totalAggByTag(tag, allowedChannelIds);
            Map<String, Object> todayData = coinRecordMapper.todayAggByTag(tag, start, end, allowedChannelIds);
            // 全量投注人数 & 今日投注人数
            long totalBetsNum = coinRecordMapper.totalBetsNumByTag(tag, allowedChannelIds);
            long todayBetsNum = coinRecordMapper.todayBetsNumByTag(tag, start, end, allowedChannelIds);

            // 今日投注额
            long todayBets = toAggLong(todayData, "bets");
            // 总投注额
            long totalBets = toAggLong(total, "bets");
            // 今日派彩额
            long todayPayOut = toAggLong(todayData, "payOut");
            // 总派彩额
            long totalPayOut = toAggLong(total, "payOut");
            // 今日盈亏（投注-派彩）
            long todayWinLows = toAggLong(todayData, "winLows");
            // 总盈亏
            long totalWinLows = toAggLong(total, "winLows");

            recharge.put(tag, mapOf("todayBets", todayBets, "totalBets", totalBets));
            prize.put(tag, mapOf("todayPayOut", todayPayOut, "totalPayOut", totalPayOut));
            winLost.put(tag, mapOf("todayWinLows", todayWinLows, "totalWinLows", totalWinLows));
            betsNums.put(tag, mapOf("todayBetsNum", todayBetsNum, "totalBetsNum", totalBetsNum));
        }

        // 空数据兜底
        if (currencyTags.isEmpty()) {
            recharge.put("无", mapOf("todayBets", 0L, "totalBets", 0L));
            prize.put("无", mapOf("todayPayOut", 0L, "totalPayOut", 0L));
            winLost.put("无", mapOf("todayWinLows", 0L, "totalWinLows", 0L));
            betsNums.put("无", mapOf("todayBetsNum", 0L, "totalBetsNum", 0L));
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("recharge", recharge);
        data.put("prize", prize);
        data.put("winLost", winLost);
        data.put("BetsNums", betsNums);
        return data;
    }

    /** 安全从聚合结果 Map 提取 long 值 */
    private long toAggLong(Map<String, Object> row, String key) {
        if (row == null || row.get(key) == null) {
            return 0L;
        }
        Object val = row.get(key);
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        return 0L;
    }

    /** 构建双键 Map（{k1: v1, k2: v2}） */
    private Map<String, Object> mapOf(String k1, long v1, String k2, long v2) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put(k1, v1);
        m.put(k2, v2);
        return m;
    }
}
