package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.CoinLog;
import com.politapi.mapper.CoinLogMapper;
import com.politapi.service.CoinLogService;
import com.politapi.util.DataScopeHelper;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 币种日志服务实现
 */
@Service
public class CoinLogServiceImpl extends ServiceImpl<CoinLogMapper, CoinLog> implements CoinLogService {

    @Override
    public Map<String, Object> getCoinLogList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);
        LambdaQueryWrapper<CoinLog> qw = new LambdaQueryWrapper<>();
        java.util.Set<Long> allowedChannels = DataScopeHelper.getAllowedChannelIds();
        if (allowedChannels != null) {
            qw.in(CoinLog::getChannelId, allowedChannels);
        }
        qw.orderByDesc(CoinLog::getId);
        IPage<CoinLog> pg = baseMapper.selectPage(Page.of(page, limit), qw);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    private long toLong(Object val, long defaultVal) {
        if (val == null) {
            return defaultVal;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        try { return Long.parseLong(val.toString()); } catch (Exception e) { return defaultVal; }
    }
}
