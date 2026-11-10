package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.controller.BaseController;
import com.politapi.entity.Channel;
import com.politapi.entity.User;
import com.politapi.mapper.ChannelMapper;
import com.politapi.mapper.UserMapper;
import com.politapi.service.FreeBetService;
import com.politapi.service.NotificationService;
import com.politapi.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 用户管理
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "用户管理", description = "用户列表、启用/禁用、加币、解锁、发放免费次数")
public class UserController extends BaseController {

    /** 大额加币通知阈值（单位：分，100000分 = 1000元） */
    private static final long LARGE_COIN_THRESHOLD = 100_000L;

    @Autowired
    private UserService userService;
    @Autowired
    private FreeBetService freeBetService;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private ChannelMapper channelMapper;
    @Autowired
    private NotificationService notificationService;

    @PostMapping("/user/getUserList")
    @Operation(summary = "用户列表", description = "分页查询用户列表（联查金币余额）。参数: offset, limit, username, channel_id, status")
    public Result<?> getUserList(@RequestBody Map<String, Object> params) {
        return Result.ok(userService.getUserList(params));
    }

    @PostMapping("/user/updateUserStatus")
    @Operation(summary = "更新用户状态", description = "参数: user_id, status（0=禁用, 1=启用）")
    public Result<?> updateUserStatus(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        try {
            Long userId = toLong(params.get("user_id"), 0);
            Integer status = params.get("status") != null ? Integer.parseInt(params.get("status").toString()) : null;
            userService.updateUserStatus(params);

            Long operatorId = (Long) request.getAttribute("adminId");
            if (status != null && status == 0) {
                // 禁用用户 → 通知所有管理员
                notificationService.notifyAllAdmins(
                        "用户已被禁用",
                        (operatorId != null ? "管理员(" + operatorId + ")" : "系统")
                                + "禁用了用户(ID:" + userId + ")",
                        null);
            }
            return Result.ok();
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    @PostMapping("/user/outGame")
    @Operation(summary = "踢出游戏", description = "参数: user_id")
    public Result<?> outGame(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        Long userId = toLong(params.get("user_id"), 0);
        Long operatorId = (Long) request.getAttribute("adminId");
        notificationService.notifyAllAdmins(
                "用户被踢出游戏",
                (operatorId != null ? "管理员(" + operatorId + ")" : "系统")
                        + "将用户(ID:" + userId + ")踢出游戏",
                null);
        return Result.ok("玩家已踢出");
    }

    @PostMapping("/user/stopGame")
    @Operation(summary = "停止游戏（预留）")
    public Result<?> stopGame() {
        return Result.ok();
    }

    @GetMapping("/user/outAll")
    @Operation(summary = "踢出所有玩家")
    public Result<?> outAll(HttpServletRequest request) {
        Long operatorId = (Long) request.getAttribute("adminId");
        notificationService.notifyAllAdmins(
                "所有玩家被踢出",
                (operatorId != null ? "管理员(" + operatorId + ")" : "系统") + "执行了踢出所有玩家操作",
                null);
        return Result.ok("已踢出所有玩家");
    }

    @PostMapping("/user/openAll")
    @Operation(summary = "解锁用户", description = "参数: user_id")
    public Result<?> openAll(@RequestBody Map<String, Object> params) {
        try {
            return Result.ok(userService.openAll(params));
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    @PostMapping("/user/addCoin")
    @Operation(summary = "给用户加币", description = "参数: channel_id, username, money（单位：分）")
    public Result<?> addCoin(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        try {
            String result = userService.addCoin(params);
            Long money = toLong(params.get("money"), 0);
            String username = (String) params.get("username");
            Long operatorId = (Long) request.getAttribute("adminId");

            if (money >= LARGE_COIN_THRESHOLD) {
                notificationService.notifyAllAdmins(
                        "大额加币提醒",
                        (operatorId != null ? "管理员(" + operatorId + ")" : "系统")
                                + "给用户 " + username + " 加币 " + money + " 分",
                        null);
            }
            return Result.ok(result);
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    @PostMapping("/user/grantFreeBet")
    @Operation(summary = "发放免费次数", description = "管理后台手动发放。参数: user_id, channel_id, count")
    public Result<?> grantFreeBet(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        try {
            Long userId = toLong(params.get("user_id"), 0L);
            Long channelId = toLong(params.get("channel_id"), 0L);
            Integer count = toInteger(params.get("count"));
            if (userId == 0 || channelId == 0 || count == null || count <= 0) {
                return Result.fail("参数不完整");
            }
            User user = userMapper.selectById(userId);
            if (user == null) {
                return Result.fail("用户不存在");
            }
            Channel channel = channelMapper.selectById(channelId);
            if (channel == null) {
                return Result.fail("渠道不存在");
            }
            String activityId = "ADMIN_GRANT";
            String sourceOrderId = "ADMIN_" + System.currentTimeMillis();
            Map<String, Object> grantResult = freeBetService.grant(
                    user.getUsername(), channel.getName(),
                    count, activityId, sourceOrderId, null, null, null);
            int code = (Integer) grantResult.get("code");
            if (code == 0) {
                Long operatorId = (Long) request.getAttribute("adminId");
                notificationService.notifyAllAdmins(
                        "免费次数已发放",
                        (operatorId != null ? "管理员(" + operatorId + ")" : "系统")
                                + "给用户 " + user.getUsername() + " 发放 " + count + " 次免费下注",
                        null);
                return Result.ok(grantResult.get("data"));
            }
            return Result.fail(code, (String) grantResult.get("message"));
        } catch (Exception e) {
            return Result.fail("服务异常");
        }
    }
}
