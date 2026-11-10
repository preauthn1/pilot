package com.politapi.service;

import java.util.Map;

/**
 * 数据报表服务接口
 */
public interface ReportService {

    /**
     * 商户报表（含汇总统计）
     */
    Map<String, Object> getMerchantReportList(Map<String, Object> params);

    /**
     * 渠道报表（含汇总统计）
     */
    Map<String, Object> getChannelReportList(Map<String, Object> params);

    /**
     * 渠道实时报表（从 coin_record 实时聚合）
     */
    Map<String, Object> getRealtimeChannelReport(Map<String, Object> params);

    /**
     * 日报表（含汇总统计）
     */
    Map<String, Object> getDailyReportList(Map<String, Object> params);
}
