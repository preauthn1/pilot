package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.GameControlService;
import com.politapi.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 实时监控控制
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "实时监控", description = "实时游戏控制操作")
public class GameControlController {

    @Autowired
    private GameControlService gameControlService;

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/monitor/realTimeSettlement")
    @Operation(summary = "实时结算", description = "调用游戏控制服强制结算")
    public Result<?> realTimeSettlement(@RequestBody Map<String, Object> params, HttpServletRequest request) {
        Long operatorId = (Long) request.getAttribute("adminId");
        String roundId = params.containsKey("roundId") ? String.valueOf(params.get("roundId"))
                : String.valueOf(params.getOrDefault("round_id", ""));
        try {
            return Result.ok(gameControlService.realTimeSettlement(params, operatorId));
        } catch (IllegalArgumentException e) {
            return Result.fail(1001, e.getMessage());
        } catch (RuntimeException e) {
            // 通知所有管理员：强制结算失败
            String title = "强制结算失败";
            String msg = "局号 " + roundId + " 结算失败：" + e.getMessage();
            notificationService.notifyAllAdmins(title, msg, null);
            return Result.fail(e.getMessage());
        }
    }
}
