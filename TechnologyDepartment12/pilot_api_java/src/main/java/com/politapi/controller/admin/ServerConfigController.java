package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.ServerConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 服务器配置
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "服务器配置", description = "游戏服务器地址/协议配置 CRUD")
public class ServerConfigController {

    @Autowired
    private ServerConfigService serverConfigService;

    @PostMapping("/serverConfig/getServerConfigList")
    @Operation(summary = "服务器配置列表")
    public Result<?> getServerConfigList(@RequestBody Map<String, Object> params) {
        return Result.ok(serverConfigService.getServerConfigList(params));
    }

    @PostMapping("/serverConfig/create")
    @Operation(summary = "创建服务器配置")
    public Result<?> create(@RequestBody Map<String, String> params) {
        return Result.ok(serverConfigService.create(params));
    }

    @PostMapping("/serverConfig/update")
    @Operation(summary = "更新服务器配置")
    public Result<?> update(@RequestBody Map<String, String> params) {
        serverConfigService.update(params);
        return Result.ok();
    }
}
