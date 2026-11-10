package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.MonitorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 管理后台 - 实时监控
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "实时监控", description = "监控登录，获取当日盈亏 AES Token")
public class MonitorController {

    @Autowired
    private MonitorService monitorService;

    @GetMapping("/monitor/monitorLogin")
    @Operation(summary = "监控登录", description = "生成 AES Token 并返回当日盈亏信息")
    public Result<?> monitorLogin(@RequestParam String gameCode, HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        try {
            return Result.ok(monitorService.monitorLogin(adminId, gameCode));
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        } catch (RuntimeException e) {
            return Result.fail(e.getMessage());
        }
    }
}
