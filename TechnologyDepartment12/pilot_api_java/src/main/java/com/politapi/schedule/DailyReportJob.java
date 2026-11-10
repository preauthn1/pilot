package com.politapi.schedule;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.entity.CurrencySetting;
import com.politapi.entity.DailyReport;
import com.politapi.mapper.CoinRecordMapper;
import com.politapi.mapper.CurrencySettingMapper;
import com.politapi.mapper.DailyReportMapper;
import com.politapi.util.LogUtil;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 每日汇总定时任务 - 按天全局聚合投注数据
 * 对应 PHP: App\Console\Commands\Report\DailyReportJob
 * 注：当前未启用调度（需手动调用 execute()），与 PHP 侧保持一致
 */
@Component
public class DailyReportJob {

    private final CoinRecordMapper coinRecordMapper;
    private final CurrencySettingMapper currencySettingMapper;
    private final DailyReportMapper dailyReportMapper;

    public DailyReportJob(CoinRecordMapper coinRecordMapper,
                          CurrencySettingMapper currencySettingMapper,
                          DailyReportMapper dailyReportMapper) {
        this.coinRecordMapper = coinRecordMapper;
        this.currencySettingMapper = currencySettingMapper;
        this.dailyReportMapper = dailyReportMapper;
    }

    /**
     * 如需启用，取消下方 @Scheduled 注释即可
     * @Scheduled(cron = "0 0 * * * *")  // 每小时
    public void scheduled() {
        execute(null);
    }
     */

    /**
     * 手动调用执行
     * @param dayTime 日期字符串 "yyyy-MM-dd"，为null则使用当天日期
     */
    public void execute(String dayTime) {
        LogUtil.write("系统自动执行任务-每日汇总报表 ------ start ------ " + now(), "DailyReportJob", "job");

        // 计算日期
        LocalDate date = LocalDate.now();
        if (LocalTime.now().isBefore(LocalTime.of(0, 20))) {
            date = date.minusDays(1);
        }
        if (dayTime != null && !dayTime.isEmpty()) {
            date = LocalDate.parse(dayTime);
        }

        String startTime = date.atStartOfDay().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String endTime = date.plusDays(1).atStartOfDay().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String dateStr = date.toString();

        List<CurrencySetting> currencySettings = currencySettingMapper.selectList(null);
        Set<String> currencyTags = new LinkedHashSet<>();
        for (CurrencySetting setting : currencySettings) {
            if (setting.getTag() != null && !setting.getTag().isEmpty()) {
                currencyTags.add(setting.getTag());
            }
        }
        for (String tag : currencyTags) {

            Map<String, Object> agg = coinRecordMapper.todayAggByTag(tag, startTime, endTime, null);
            if (agg == null || agg.isEmpty()) {
                continue;
            }

            long betsNumber = coinRecordMapper.todayBetsNumByTag(tag, startTime, endTime, null);

            Long bets = toLong(agg.get("bets"));
            Long payout = toLong(agg.get("payOut"));
            // playerWl = pay_out - bet, platformWl = bet - pay_out
            Long playerWl = payout - bets;
            Long platformWl = bets - payout;

            DailyReport report = dailyReportMapper.selectOne(
                    new LambdaQueryWrapper<DailyReport>()
                            .eq(DailyReport::getDate, dateStr)
                            .eq(DailyReport::getTag, tag)
            );

            if (report == null) {
                DailyReport newReport = new DailyReport();
                newReport.setDate(dateStr);
                newReport.setBetsNumber(betsNumber);
                newReport.setBets(bets);
                newReport.setPayout(payout);
                newReport.setPlayerWl(playerWl);
                newReport.setPlatformWl(platformWl);
                newReport.setTag(tag);
                newReport.setCreatedAt(now());
                newReport.setUpdatedAt(now());
                dailyReportMapper.insert(newReport);
            } else {
                report.setBetsNumber(betsNumber);
                report.setBets(bets);
                report.setPayout(payout);
                report.setPlayerWl(playerWl);
                report.setPlatformWl(platformWl);
                report.setUpdatedAt(now());
                dailyReportMapper.updateById(report);
            }
        }

        LogUtil.write("系统自动执行任务-每日汇总报表 ------ end ------ " + now(), "DailyReportJob", "job");
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
