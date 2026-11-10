package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.politapi.entity.Admin;
import com.politapi.entity.AdminOperationLog;
import com.politapi.mapper.AdminMapper;
import com.politapi.mapper.AdminOperationLogMapper;
import com.politapi.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 操作日志服务实现
 */
@Service
public class LogServiceImpl implements LogService {

    @Autowired private AdminOperationLogMapper logMapper;
    @Autowired private AdminMapper adminMapper;

    @Override
    public Map<String, Object> adminOperationLog(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);

        LambdaQueryWrapper<AdminOperationLog> qw = new LambdaQueryWrapper<>();
        Object adminId = params.get("adminId");
        if (adminId != null && !adminId.toString().isEmpty()) {
            qw.eq(AdminOperationLog::getAdminId, Long.parseLong(adminId.toString()));
        }
        Object adminName = params.get("adminName");
        if (adminName != null && !adminName.toString().isEmpty()) {
            List<Admin> admins = adminMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Admin>()
                    .like(Admin::getName, adminName.toString())
            );
            if (admins.isEmpty()) {
                qw.eq(AdminOperationLog::getAdminId, -1L);
            } else {
                qw.in(AdminOperationLog::getAdminId, admins.stream().map(Admin::getId).toArray());
            }
        }
        Object url = params.get("url");
        if (url != null && !url.toString().isEmpty()) {
            qw.like(AdminOperationLog::getUrl, url.toString());
        }
        Object time = params.get("time");
        if (time instanceof List && ((List<?>) time).size() == 2) {
            List<?> range = (List<?>) time;
            if (range.get(0) != null && !range.get(0).toString().isEmpty()) {
                qw.ge(AdminOperationLog::getCreatedAt, range.get(0).toString());
            }
            if (range.get(1) != null && !range.get(1).toString().isEmpty()) {
                qw.le(AdminOperationLog::getCreatedAt, range.get(1).toString());
            }
        }

        qw.orderByDesc(AdminOperationLog::getCreatedAt);
        IPage<AdminOperationLog> pg = logMapper.selectPage(Page.of(page, limit), qw);

        List<Map<String, Object>> list = new ArrayList<>();
        for (AdminOperationLog log : pg.getRecords()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", log.getId());
            item.put("adminId", log.getAdminId());
            Admin admin = log.getAdminId() != null ? adminMapper.selectById(log.getAdminId()) : null;
            item.put("adminName", admin != null ? admin.getName() : "");
            item.put("ip", log.getIp());
            item.put("url", log.getUrl());
            item.put("params", log.getParams());
            item.put("note", log.getNote());
            item.put("createdAt", log.getCreatedAt());
            list.add(item);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", list);
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
