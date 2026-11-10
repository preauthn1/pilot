package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.IpList;
import com.politapi.mapper.IpListMapper;
import com.politapi.service.IpListService;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * IP白名单服务实现
 */
@Service
public class IpListServiceImpl extends ServiceImpl<IpListMapper, IpList> implements IpListService {

    @Override
    public Map<String, Object> getIpList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);
        IPage<IpList> pg = baseMapper.selectPage(Page.of(page, limit),
                new LambdaQueryWrapper<IpList>().orderByDesc(IpList::getId));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public Long create(Map<String, String> params) {
        IpList ip = new IpList();
        ip.setIp(params.get("ip"));
        ip.setAdminStatus(Integer.parseInt(params.getOrDefault("admin_status", "1")));
        ip.setApiStatus(Integer.parseInt(params.getOrDefault("api_status", "1")));
        ip.setRemarks(params.getOrDefault("remarks", ""));
        baseMapper.insert(ip);
        return ip.getId();
    }

    @Override
    public void update(Map<String, String> params) {
        IpList ip = new IpList();
        ip.setId(Long.parseLong(params.get("id")));
        if (params.containsKey("ip")) {
            ip.setIp(params.get("ip"));
        }
        if (params.containsKey("admin_status")) {
            ip.setAdminStatus(Integer.parseInt(params.get("admin_status")));
        }
        if (params.containsKey("api_status")) {
            ip.setApiStatus(Integer.parseInt(params.get("api_status")));
        }
        baseMapper.updateById(ip);
    }

    @Override
    public void delete(Long id) {
        baseMapper.deleteById(id);
    }

    @Override
    public boolean isIpAllowed(String ip, String pathType) {
        // 根据路径类型选择对应的状态字段
        boolean isAdmin = "admin".equals(pathType);
        LambdaQueryWrapper<IpList> wrapper = new LambdaQueryWrapper<IpList>();
        if (isAdmin) {
            wrapper.eq(IpList::getAdminStatus, 1);
        } else {
            wrapper.eq(IpList::getApiStatus, 1);
        }

        // 先查该类型下是否有启用的白名单记录，若无则放行（防止空表锁死）
        long totalEnabled = baseMapper.selectCount(wrapper);
        if (totalEnabled == 0) {
            return true;
        }

        // 有记录时，必须 IP 匹配才放行
        wrapper.eq(IpList::getIp, ip);
        return baseMapper.selectCount(wrapper) > 0;
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
