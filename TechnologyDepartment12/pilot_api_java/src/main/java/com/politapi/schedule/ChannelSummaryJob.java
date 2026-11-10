package com.politapi.schedule;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.entity.ChannelReport;
import com.politapi.entity.CurrencySetting;
import com.politapi.mapper.ChannelReportMapper;
import com.politapi.mapper.CoinRecordMapper;
import com.politapi.mapper.CurrencySettingMapper;
import com.politapi.util.LogUtil;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 渠道汇总定时任务 - 每15分钟聚合一次渠道投注数据
 * 对应 PHP: App\Console\Commands\Report\ChannelSummaryJob
 */
@Component
@ConditionalOnProperty(
    name = "app.scheduler.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class ChannelSummaryJob {

    private final CoinRecordMapper coinRecordMapper;
    private final CurrencySettingMapper currencySettingMapper;
    private final ChannelReportMapper channelReportMapper;

    public ChannelSummaryJob(CoinRecordMapper coinRecordMapper,
                             CurrencySettingMapper currencySettingMapper,
                             ChannelReportMapper channelReportMapper) {
        this.coinRecordMapper = coinRecordMapper;
        this.currencySettingMapper = currencySettingMapper;
        this.channelReportMapper = channelReportMapper;
    }

    /**
     * 定时执行：每15分钟
     */
    @Scheduled(cron = "0 */15 * * * *")
    public void execute() {
        execute(null);
    }

    /**
     * 可手动传入日期执行
     * @param dayTime 日期字符串 "yyyy-MM-dd"，为null则使用当天日期
     */
    public void execute(String dayTime) {
        LogUtil.write("系统自动执行任务-渠道汇总报表 ------ start ------ " + now(), "ChannelSummaryJob", "job");

        // 计算日期
        LocalDate date = LocalDate.now();
        if (LocalTime.now().isBefore(LocalTime.of(0, 20))) {
            date = date.minusDays(1);
        }
        if (dayTime != null && !dayTime.isEmpty()) {
            date = LocalDate.parse(dayTime);
        }

        long startTimestamp = date.atStartOfDay(ZoneId.systemDefault()).toEpochSecond();
        long endTimestamp = date.atTime(LocalTime.of(23, 59, 59)).atZone(ZoneId.systemDefault()).toEpochSecond();

        String startTimeStr = date.atStartOfDay().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String endTimeStr = date.atTime(LocalTime.of(23, 59, 59)).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        List<CurrencySetting> currencySettings = currencySettingMapper.selectList(null);
        for (CurrencySetting setting : currencySettings) {
            Long configuredChannelId = setting.getChannelId();
            String tag = setting.getTag();
            if (configuredChannelId == null || tag == null || tag.isEmpty()) {
                continue;
            }

            List<Map<String, Object>> list = coinRecordMapper.channelSummaryByTag(configuredChannelId, tag, startTimestamp, endTimestamp);
            if (list == null || list.isEmpty()) {
                continue;
            }

            for (Map<String, Object> item : list) {
                Long channelId = toLong(item.get("channelId"));
                if (channelId == null) {
                    continue;
                }
                String gameCode = item.get("gameCode") == null ? "__legacy__" : item.get("gameCode").toString();

                long betsNumber = coinRecordMapper.channelBetsNumByTag(channelId, tag, gameCode, startTimestamp, endTimestamp);

                // 查找已有报表
                ChannelReport report = channelReportMapper.selectOne(
                        new LambdaQueryWrapper<ChannelReport>()
                                .eq(ChannelReport::getChannelId, channelId)
                                .eq(ChannelReport::getTag, tag)
                                .eq("__legacy__".equals(gameCode), ChannelReport::getGameCode, null)
                                .eq(!"__legacy__".equals(gameCode), ChannelReport::getGameCode, gameCode)
                                .between(ChannelReport::getCreatedAt, startTimeStr, endTimeStr)
                );

                boolean res;
                if (report == null) {
                    ChannelReport newReport = new ChannelReport();
                    newReport.setChannelId(channelId);
                    newReport.setMerchantId(toLong(item.get("merchantId")));
                    newReport.setBetsNumber(betsNumber);
                    newReport.setBets(toLong(item.get("bets")));
                    newReport.setPayout(toLong(item.get("payout")));
                    newReport.setPlayerWl(toLong(item.get("playerWl")));
                    newReport.setPlatformWl(toLong(item.get("platformWl")));
                    newReport.setTag(tag);
                    newReport.setGameCode("__legacy__".equals(gameCode) ? null : gameCode);
                    newReport.setCreatedAt(startTimeStr);
                    newReport.setUpdatedAt(now());
                    res = channelReportMapper.insert(newReport) > 0;
                } else {
                    report.setBetsNumber(betsNumber);
                    report.setBets(toLong(item.get("bets")));
                    report.setPayout(toLong(item.get("payout")));
                    report.setPlayerWl(toLong(item.get("playerWl")));
                    report.setPlatformWl(toLong(item.get("platformWl")));
                    report.setUpdatedAt(now());
                    res = channelReportMapper.updateById(report) > 0;
                }

                if (!res) {
                    LogUtil.write("系统自动执行任务-渠道汇总报表 ------ error: " + res + "----data: " + item, "ChannelSummaryJob", "job");
                }
            }
        }

        LogUtil.write("系统自动执行任务-渠道汇总报表 ------ end ------ " + now(), "ChannelSummaryJob", "job");
    }

    private static String now() {
        return java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private static Long toLong(Object obj) {
        if (obj == null) {
            return 0L;
        }
        if (obj instanceof Number) {
            return ((Number) obj).longValue();
        }
        try {
            return Long.parseLong(obj.toString());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
