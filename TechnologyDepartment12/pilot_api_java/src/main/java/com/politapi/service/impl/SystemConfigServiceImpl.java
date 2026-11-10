package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.SystemConfig;
import com.politapi.mapper.SystemConfigMapper;
import com.politapi.service.SystemConfigService;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 系统配置服务实现
 */
@Service
public class SystemConfigServiceImpl extends ServiceImpl<SystemConfigMapper, SystemConfig> implements SystemConfigService {

    @Override
    public Map<String, Object> getSystemConfigList(Map<String, Object> params) {
        IPage<SystemConfig> pg = baseMapper.selectPage(
                Page.of(Math.max(toLong(params.get("offset"), 1), 1), toLong(params.get("limit"), 10)),
                new LambdaQueryWrapper<SystemConfig>().orderByDesc(SystemConfig::getId));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public Long create(Map<String, String> params) {
        SystemConfig sc = new SystemConfig();
        sc.setCfgKey(params.get("key"));
        sc.setCfgValue(params.get("value"));
        if (params.containsKey("remark")) {
            sc.setRemark(params.get("remark"));
        }
        baseMapper.insert(sc);
        return sc.getId();
    }

    @Override
    public void update(Map<String, String> params) {
        SystemConfig sc = new SystemConfig();
        sc.setId(Long.parseLong(params.get("id")));
        if (params.containsKey("key")) {
            sc.setCfgKey(params.get("key"));
        }
        if (params.containsKey("value")) {
            sc.setCfgValue(params.get("value"));
        }
        if (params.containsKey("remark")) {
            sc.setRemark(params.get("remark"));
        }
        baseMapper.updateById(sc);
    }

    @Override
    public void delete(Long id) {
        baseMapper.deleteById(id);
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
