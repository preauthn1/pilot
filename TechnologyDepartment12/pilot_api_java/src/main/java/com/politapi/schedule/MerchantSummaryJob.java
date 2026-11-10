package com.politapi.schedule;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.entity.CurrencySetting;
import com.politapi.entity.MerchantReport;
import com.politapi.mapper.CoinRecordMapper;
import com.politapi.mapper.CurrencySettingMapper;
import com.politapi.mapper.MerchantReportMapper;
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
 * 商户汇总定时任务 - 按商户聚合投注数据
 * 对应 PHP: App\Console\Commands\Report\MerchantSummaryJob
 * 注：当前未启用调度（需手动调用 execute()），与 PHP 侧保持一致
 */
@Component
public class MerchantSummaryJob {

    private final CoinRecordMapper coinRecordMapper;
    private final CurrencySettingMapper currencySettingMapper;
    private final MerchantReportMapper merchantReportMapper;

    public MerchantSummaryJob(CoinRecordMapper coinRecordMapper,
                              CurrencySettingMapper currencySettingMapper,
                              MerchantReportMapper merchantReportMapper) {
        this.coinRecordMapper = coinRecordMapper;
        this.currencySettingMapper = currencySettingMapper;
        this.merchantReportMapper = merchantReportMapper;
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
        LogUtil.write("系统自动执行任务-商户汇总报表 ------ start ------ " + now(), "MerchantSummaryJob", "job");

        // 计算日期
        LocalDate date = LocalDate.now();
        if (LocalTime.now().isBefore(LocalTime.of(0, 20))) {
            date = date.minusDays(1);
        }
        if (dayTime != null && !dayTime.isEmpty()) {
            date = LocalDate.parse(dayTime);
        }

        String startTime = date.atStartOfDay().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String endTime = date.atTime(LocalTime.of(23, 59, 59)).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        List<CurrencySetting> currencySettings = currencySettingMapper.selectList(null);
        Set<String> currencyTags = new LinkedHashSet<>();
        for (CurrencySetting setting : currencySettings) {
            if (setting.getTag() != null && !setting.getTag().isEmpty()) {
                currencyTags.add(setting.getTag());
            }
        }
        for (String tag : currencyTags) {

            List<Map<String, Object>> list = coinRecordMapper.merchantSummaryByTag(tag, startTime, endTime);
            if (list == null || list.isEmpty()) {
                continue;
            }

            for (Map<String, Object> item : list) {
                Long merchantId = toLong(item.get("merchantId"));
                if (merchantId == null) {
                    continue;
                }

                long betsNumber = coinRecordMapper.merchantBetsNumByTag(merchantId, tag, startTime, endTime);

                MerchantReport report = merchantReportMapper.selectOne(
                        new LambdaQueryWrapper<MerchantReport>()
                                .eq(MerchantReport::getMerchantId, merchantId)
                                .eq(MerchantReport::getTag, tag)
                                .between(MerchantReport::getCreatedAt, startTime, endTime)
                );

                boolean res;
                if (report == null) {
                    MerchantReport newReport = new MerchantReport();
                    newReport.setMerchantId(merchantId);
                    newReport.setBetsNumber(betsNumber);
                    newReport.setBets(toLong(item.get("bets")));
                    newReport.setPayout(toLong(item.get("payout")));
                    newReport.setPlayerWl(toLong(item.get("playerWl")));
                    newReport.setPlatformWl(toLong(item.get("platformWl")));
                    newReport.setTag(tag);
                    newReport.setCreatedAt(now());
                    newReport.setUpdatedAt(now());
                    res = merchantReportMapper.insert(newReport) > 0;
                } else {
                    report.setBetsNumber(betsNumber);
                    report.setBets(toLong(item.get("bets")));
                    report.setPayout(toLong(item.get("payout")));
                    report.setPlayerWl(toLong(item.get("playerWl")));
                    report.setPlatformWl(toLong(item.get("platformWl")));
                    report.setUpdatedAt(now());
                    res = merchantReportMapper.updateById(report) > 0;
                }

                if (!res) {
                    LogUtil.write("系统自动执行任务-商户汇总报表 ------ error: " + res + "----data: " + item, "MerchantSummaryJob", "job");
                }
            }
        }

        LogUtil.write("系统自动执行任务-商户汇总报表 ------ end ------ " + now(), "MerchantSummaryJob", "job");
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
