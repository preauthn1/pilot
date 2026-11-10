package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.LogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 操作日志
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "操作日志", description = "管理员操作日志查询")
public class LogController {

    @Autowired
    private LogService logService;

    @PostMapping("/log/adminOperationLog")
    @Operation(summary = "操作日志列表", description = "分页查询管理员操作日志")
    public Result<?> adminOperationLog(@RequestBody Map<String, Object> params) {
        return Result.ok(logService.adminOperationLog(params));
    }
}
