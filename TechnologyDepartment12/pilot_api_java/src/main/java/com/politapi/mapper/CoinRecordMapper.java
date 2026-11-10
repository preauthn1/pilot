package com.politapi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.politapi.entity.CoinRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.*;

/**
 * 投注记录 Mapper - 提供注单查询与多维统计（SQL 定义在 CoinRecordMapper.xml）
 */
@Mapper
public interface CoinRecordMapper extends BaseMapper<CoinRecord> {

    /**
     * 联查投注记录（XML 中定义）
     */
    List<Map<String, Object>> getCoinRecordList(@Param("channelId") String channelId,
                                                @Param("merchantId") String merchantId, @Param("username") String username,
                                                @Param("tag") String tag, @Param("bureauNumber") String bureauNumber,
                                                @Param("gameCode") String gameCode,
                                                @Param("id") String id, @Param("startAt") String startAt,
                                                @Param("endAt") String endAt, @Param("offset") int offset,
                                                @Param("limit") int limit, @Param("sort") String sort,
                                                @Param("orderVal") String orderVal,
                                                @Param("allowedChannelIds") Set<Long> allowedChannelIds);

    /**
     * 统计投注记录总数（XML 中定义）
     */
    long getCoinRecordTotal(@Param("channelId") String channelId,
                            @Param("merchantId") String merchantId, @Param("username") String username,
                            @Param("tag") String tag, @Param("bureauNumber") String bureauNumber,
                            @Param("gameCode") String gameCode,
                            @Param("id") String id, @Param("startAt") String startAt,
                            @Param("endAt") String endAt,
                            @Param("allowedChannelIds") Set<Long> allowedChannelIds);

    /**
     * 按 tag 聚合全量投注/派彩/盈亏（XML 中定义）
     */
    Map<String, Object> totalAggByTag(@Param("tag") String tag,
                                      @Param("allowedChannelIds") Set<Long> allowedChannelIds);

    /**
     * 按 tag 聚合今日投注/派彩/盈亏（XML 中定义）
     */
    Map<String, Object> todayAggByTag(@Param("tag") String tag,
                                      @Param("start") String start, @Param("end") String end,
                                      @Param("allowedChannelIds") Set<Long> allowedChannelIds);

    /**
     * 按 tag 统计全量投注人数（XML 中定义）
     */
    long totalBetsNumByTag(@Param("tag") String tag,
                           @Param("allowedChannelIds") Set<Long> allowedChannelIds);

    /**
     * 按 tag 统计今日投注人数（XML 中定义）
     */
    long todayBetsNumByTag(@Param("tag") String tag,
                           @Param("start") String start, @Param("end") String end,
                           @Param("allowedChannelIds") Set<Long> allowedChannelIds);

    /**
     * 渠道实时报表：按天分组聚合投注/派彩/盈亏（XML 中定义）
     */
    List<Map<String, Object>> realtimeChannelReport(@Param("channelId") Long channelId,
                                                    @Param("tag") String tag,
                                                    @Param("gameCode") String gameCode,
                                                    @Param("startAt") String startAt, @Param("endAt") String endAt,
                                                    @Param("offsetRows") long offsetRows,
                                                    @Param("limit") long limit);

    /**
     * 渠道实时报表：按当前筛选条件统计分组总数（XML 中定义）
     */
    long realtimeChannelReportTotal(@Param("channelId") Long channelId,
                                    @Param("tag") String tag,
                                    @Param("gameCode") String gameCode,
                                    @Param("startAt") String startAt, @Param("endAt") String endAt);

    /**
     * 渠道实时报表：按当前筛选条件汇总投注/派彩/盈亏（XML 中定义）
     */
    Map<String, Object> realtimeChannelSummary(@Param("channelId") Long channelId,
                                               @Param("tag") String tag,
                                               @Param("gameCode") String gameCode,
                                               @Param("startAt") String startAt, @Param("endAt") String endAt);

    /**
     * 渠道实时报表：按当前筛选条件统计去重投注人数（XML 中定义）
     */
    long realtimeChannelBetsNumber(@Param("channelId") Long channelId,
                                   @Param("tag") String tag,
                                   @Param("gameCode") String gameCode,
                                   @Param("startAt") String startAt, @Param("endAt") String endAt);

    // ==================== 定时任务报表 ====================

    /**
     * 渠道汇总：按渠道聚合投注/派彩/盈亏（定时任务用）
     */
    List<Map<String, Object>> channelSummaryByTag(@Param("channelId") Long channelId,
                                                  @Param("tag") String tag,
                                                  @Param("startTime") Long startTime,
                                                  @Param("endTime") Long endTime);

    /**
     * 渠道汇总：某一渠道的投注人数（定时任务用）
     */
    long channelBetsNumByTag(@Param("channelId") Long channelId,
                             @Param("tag") String tag,
                             @Param("gameCode") String gameCode,
                             @Param("startTime") Long startTime,
                             @Param("endTime") Long endTime);

    /**
     * 商户汇总：按商户聚合投注/派彩/盈亏（定时任务用）
     */
    List<Map<String, Object>> merchantSummaryByTag(@Param("tag") String tag,
                                                    @Param("startTime") String startTime,
                                                    @Param("endTime") String endTime);

    /**
     * 商户汇总：某一商户的投注人数（定时任务用）
     */
    long merchantBetsNumByTag(@Param("merchantId") Long merchantId,
                               @Param("tag") String tag,
                               @Param("startTime") String startTime,
                               @Param("endTime") String endTime);
}
