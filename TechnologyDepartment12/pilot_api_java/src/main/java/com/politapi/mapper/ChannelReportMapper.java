package com.politapi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.politapi.entity.ChannelReport;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface ChannelReportMapper extends BaseMapper<ChannelReport> {
    List<Map<String, Object>> selectReportList(Map<String, Object> params);

    long countReportList(Map<String, Object> params);

    Map<String, Object> sumReportList(Map<String, Object> params);

    List<Map<String, Object>> selectMerchantReportList(Map<String, Object> params);

    long countMerchantReportList(Map<String, Object> params);

    Map<String, Object> sumMerchantReportList(Map<String, Object> params);

    List<Map<String, Object>> selectDailyReportList(Map<String, Object> params);

    long countDailyReportList(Map<String, Object> params);

    Map<String, Object> sumDailyReportList(Map<String, Object> params);
}
