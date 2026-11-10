package com.politapi.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.politapi.entity.Notification;

import java.util.List;
import java.util.Map;

/**
 * 站内通知服务接口
 */
public interface NotificationService extends IService<Notification> {

    /**
     * 分页查询当前管理员的未读通知列表
     */
    Map<String, Object> list(Long adminId, Map<String, Object> params);

    /**
     * 标记单条通知为已读
     */
    void read(Long adminId, Long notificationId);

    /**
     * 全部标记为已读
     */
    void readAll(Long adminId);

    /**
     * 删除单条通知
     */
    void delete(Long adminId, Long notificationId);

    /**
     * 清空所有通知
     */
    void clearAll(Long adminId);

    /**
     * 获取未读通知数量
     */
    long unreadCount(Long adminId);

    /**
     * 创建通知
     */
    void create(Long adminId, String title, String message, String avatar, String link);

    /**
     * 批量创建通知（推送给指定管理员列表）
     */
    void createBatch(List<Long> adminIds, String title, String message, String avatar, String link);

    /**
     * 通知所有管理员（系统级通知）
     */
    void notifyAllAdmins(String title, String message, String link);

    /**
     * 通知当前操作人（单条通知）
     */
    void notifyOperator(Long adminId, String title, String message, String link);
}
