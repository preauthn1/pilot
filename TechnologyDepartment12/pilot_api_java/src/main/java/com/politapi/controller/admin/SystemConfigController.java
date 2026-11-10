package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.SystemConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 系统配置
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "系统配置", description = "系统级参数配置 CRUD")
public class SystemConfigController {

    @Autowired
    private SystemConfigService systemConfigService;

    @PostMapping({"/systemConfig/getSystemConfigList", "/systemConfig/systemConfigSet"})
    @Operation(summary = "系统配置列表")
    public Result<?> getSystemConfigList(@RequestBody Map<String, Object> params) {
        return Result.ok(systemConfigService.getSystemConfigList(params));
    }

    @PostMapping("/systemConfig/create")
    @Operation(summary = "创建系统配置")
    public Result<?> create(@RequestBody Map<String, String> params) {
        return Result.ok(systemConfigService.create(params));
    }

    @PostMapping("/systemConfig/update")
    @Operation(summary = "更新系统配置")
    public Result<?> update(@RequestBody Map<String, String> params) {
        systemConfigService.update(params);
        return Result.ok();
    }

    @PostMapping({"/systemConfig/delSystemConfig", "/systemConfig/delete"})
    @Operation(summary = "删除系统配置", description = "参数: id")
    public Result<?> delSystemConfig(@RequestBody Map<String, Object> params) {
        systemConfigService.delete(toLong(params.get("id"), 0));
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
