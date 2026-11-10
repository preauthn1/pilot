package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 管理后台 - 站内通知
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "站内通知", description = "站内通知：列表、已读/未读、删除、清空")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /** 获取当前管理员的未读通知数量 */
    @PostMapping("/notification/unreadCount")
    @Operation(summary = "未读通知数", description = "获取当前登录管理员的未读通知数量")
    public Result<?> unreadCount(HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId == null) {
            return Result.fail(401, "not logged in");
        }
        return Result.ok(notificationService.unreadCount(adminId));
    }

    /** 分页查询通知列表 */
    @PostMapping("/notification/list")
    @Operation(summary = "通知列表", description = "分页查询当前管理员的站内通知，参数: offset, limit")
    public Result<?> list(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId == null) {
            return Result.fail(401, "not logged in");
        }
        return Result.ok(notificationService.list(adminId, params));
    }

    /** 标记单条通知为已读 */
    @PostMapping("/notification/read")
    @Operation(summary = "标记已读", description = "标记指定通知为已读，参数: id")
    public Result<?> read(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId == null) {
            return Result.fail(401, "not logged in");
        }
        Long id = toLong(params.get("id"), 0);
        if (id == 0) {
            return Result.fail("参数不完整");
        }
        notificationService.read(adminId, id);
        return Result.ok();
    }

    /** 全部标记为已读 */
    @PostMapping("/notification/readAll")
    @Operation(summary = "全部已读", description = "将当前管理员所有通知标记为已读")
    public Result<?> readAll(HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId == null) {
            return Result.fail(401, "not logged in");
        }
        notificationService.readAll(adminId);
        return Result.ok();
    }

    /** 删除单条通知 */
    @PostMapping("/notification/delete")
    @Operation(summary = "删除通知", description = "删除指定通知，参数: id")
    public Result<?> delete(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId == null) {
            return Result.fail(401, "not logged in");
        }
        Long id = toLong(params.get("id"), 0);
        if (id == 0) {
            return Result.fail("参数不完整");
        }
        notificationService.delete(adminId, id);
        return Result.ok();
    }

    /** 清空所有通知 */
    @PostMapping("/notification/clearAll")
    @Operation(summary = "清空通知", description = "清空当前管理员的所有通知")
    public Result<?> clearAll(HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId == null) {
            return Result.fail(401, "not logged in");
        }
        notificationService.clearAll(adminId);
        return Result.ok();
    }

    /** 发送通知（内部调用，可指定管理员列表） */
    @PostMapping("/notification/send")
    @Operation(summary = "发送通知", description = "给指定管理员发送站内通知，参数: adminIds(数组), title, message, avatar, link")
    public Result<?> send(@RequestBody Map<String, Object> params) {
        String title = (String) params.get("title");
        String message = (String) params.get("message");
        if (title == null || title.isEmpty() || message == null || message.isEmpty()) {
            return Result.fail("title 和 message 不能为空");
        }
        String avatar = (String) params.getOrDefault("avatar", "");
        String link = (String) params.getOrDefault("link", "");

        @SuppressWarnings("unchecked")
        List<Integer> rawIds = (List<Integer>) params.get("adminIds");
        if (rawIds == null || rawIds.isEmpty()) {
            return Result.fail("adminIds 不能为空");
        }
        List<Long> adminIds = rawIds.stream().map(Integer::longValue).toList();
        notificationService.createBatch(adminIds, title, message, avatar, link);
        return Result.ok();
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
