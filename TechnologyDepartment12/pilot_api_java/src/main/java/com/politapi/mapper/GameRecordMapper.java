package com.politapi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.politapi.entity.GameRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 游戏记录 Mapper - 提供游戏记录的查询与统计
 */
@Mapper
public interface GameRecordMapper extends BaseMapper<GameRecord> {

    /**
     * 统计指定时间范围内 settlement 总和
     */
    @Select("SELECT IFNULL(SUM(settlement),0) FROM lms_game_record WHERE created_at BETWEEN #{start} AND #{end} AND game_code = #{gameCode}")
    long sumSettlementBetween(@Param("start") String start, @Param("end") String end, @Param("gameCode") String gameCode);

    /**
     * 分页查询游戏记录列表（XML 中定义）
     */
    List<Map<String, Object>> getGameRecordList(@Param("billingType") String billingType,
            @Param("roundId") String roundId, @Param("startAt") String startAt,
            @Param("gameCode") String gameCode,
            @Param("endAt") String endAt, @Param("offset") int offset, @Param("limit") int limit,
            @Param("allowedChannelIds") java.util.Set<Long> allowedChannelIds);

    /**
     * 统计游戏记录总数
     */
    long getGameRecordTotal(@Param("billingType") String billingType,
            @Param("roundId") String roundId, @Param("startAt") String startAt,
            @Param("gameCode") String gameCode,
            @Param("endAt") String endAt,
            @Param("allowedChannelIds") java.util.Set<Long> allowedChannelIds);

    /**
     * 获取全局汇总统计（无筛选条件）
     */
    Map<String, Object> getGlobalSummary(@Param("gameCode") String gameCode, @Param("allowedChannelIds") java.util.Set<Long> allowedChannelIds);

    /**
     * 根据筛选条件获取汇总统计
     */
    Map<String, Object> getFilteredSummary(@Param("billingType") String billingType,
            @Param("roundId") String roundId, @Param("startAt") String startAt,
            @Param("gameCode") String gameCode,
            @Param("endAt") String endAt,
            @Param("allowedChannelIds") java.util.Set<Long> allowedChannelIds);
}
