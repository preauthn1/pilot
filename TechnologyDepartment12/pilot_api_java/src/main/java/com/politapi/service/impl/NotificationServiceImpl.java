package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.Notification;
import com.politapi.mapper.AdminMapper;
import com.politapi.mapper.NotificationMapper;
import com.politapi.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 站内通知服务实现
 */
@Service
public class NotificationServiceImpl extends ServiceImpl<NotificationMapper, Notification> implements NotificationService {

    @Autowired
    private AdminMapper adminMapper;

    @Override
    public Map<String, Object> list(Long adminId, Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);

        LambdaQueryWrapper<Notification> qw = new LambdaQueryWrapper<Notification>()
                .eq(Notification::getAdminId, adminId)
                .orderByDesc(Notification::getId);

        IPage<Notification> pg = baseMapper.selectPage(Page.of(page, limit), qw);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public void read(Long adminId, Long notificationId) {
        baseMapper.update(null,
                new LambdaUpdateWrapper<Notification>()
                        .eq(Notification::getId, notificationId)
                        .eq(Notification::getAdminId, adminId)
                        .set(Notification::getIsRead, 1)
                        .set(Notification::getUpdatedAt, LocalDateTime.now())
        );
    }

    @Override
    public void readAll(Long adminId) {
        baseMapper.update(null,
                new LambdaUpdateWrapper<Notification>()
                        .eq(Notification::getAdminId, adminId)
                        .eq(Notification::getIsRead, 0)
                        .set(Notification::getIsRead, 1)
                        .set(Notification::getUpdatedAt, LocalDateTime.now())
        );
    }

    @Override
    public void delete(Long adminId, Long notificationId) {
        baseMapper.delete(
                new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getId, notificationId)
                        .eq(Notification::getAdminId, adminId)
        );
    }

    @Override
    public void clearAll(Long adminId) {
        baseMapper.delete(
                new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getAdminId, adminId)
        );
    }

    @Override
    public long unreadCount(Long adminId) {
        return baseMapper.selectCount(
                new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getAdminId, adminId)
                        .eq(Notification::getIsRead, 0)
        );
    }

    @Override
    public void create(Long adminId, String title, String message, String avatar, String link) {
        Notification n = new Notification();
        n.setAdminId(adminId);
        n.setTitle(title);
        n.setMessage(message);
        n.setAvatar(avatar != null ? avatar : "");
        n.setLink(link != null ? link : "");
        n.setIsRead(0);
        n.setCreatedAt(LocalDateTime.now());
        n.setUpdatedAt(LocalDateTime.now());
        baseMapper.insert(n);
    }

    @Override
    public void createBatch(List<Long> adminIds, String title, String message, String avatar, String link) {
        for (Long adminId : adminIds) {
            create(adminId, title, message, avatar, link);
        }
    }

    @Override
    public void notifyAllAdmins(String title, String message, String link) {
        List<Long> adminIds = adminMapper.selectList(null).stream()
                .map(a -> a.getId())
                .collect(Collectors.toList());
        if (!adminIds.isEmpty()) {
            createBatch(adminIds, title, message, "", link);
        }
    }

    @Override
    public void notifyOperator(Long adminId, String title, String message, String link) {
        create(adminId, title, message, "", link);
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
