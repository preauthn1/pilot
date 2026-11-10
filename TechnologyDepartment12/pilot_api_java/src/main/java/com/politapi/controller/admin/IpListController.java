package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.IpListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - IP白名单
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "IP白名单", description = "IP 访问控制 CRUD")
public class IpListController {

    @Autowired
    private IpListService ipListService;

    @PostMapping("/ipList/getIpList")
    @Operation(summary = "IP白名单列表")
    public Result<?> getIpList(@RequestBody Map<String, Object> params) {
        return Result.ok(ipListService.getIpList(params));
    }

    @PostMapping("/ipList/create")
    @Operation(summary = "新增IP")
    public Result<?> create(@RequestBody Map<String, String> params) {
        return Result.ok(ipListService.create(params));
    }

    @PostMapping("/ipList/update")
    @Operation(summary = "更新IP")
    public Result<?> update(@RequestBody Map<String, String> params) {
        ipListService.update(params);
        return Result.ok();
    }

    @PostMapping("/ipList/del")
    @Operation(summary = "删除IP", description = "参数: id")
    public Result<?> del(@RequestBody Map<String, Object> params) {
        ipListService.delete(toLong(params.get("id"), 0));
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
