package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 权限管理
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "权限管理", description = "权限 CRUD、权限树、拖拽排序")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    /** 分页查询权限列表 */
    @PostMapping("/permissions")
    @Operation(summary = "权限列表", description = "分页查询权限")
    public Result<?> permissions(@RequestBody Map<String, Object> params) {
        return Result.ok(permissionService.permissions(params));
    }

    /** 查询单个权限详情 */
    @PostMapping("/permission")
    @Operation(summary = "查询权限", description = "根据 id 查询单个权限")
    public Result<?> permission(@RequestBody Map<String, Object> params) {
        Long id = toLong(params.get("id"), 0);
        return Result.ok(permissionService.getPermission(id));
    }

    /** 创建权限 */
    @PostMapping("/permission/create")
    @Operation(summary = "创建权限")
    public Result<?> create(@RequestBody Map<String, String> params) {
        return Result.ok(permissionService.create(params));
    }

    /** 更新权限 */
    @PostMapping("/permission/update")
    @Operation(summary = "更新权限")
    public Result<?> update(@RequestBody Map<String, String> params) {
        try {
            permissionService.update(params);
            return Result.ok();
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    /** 删除权限（含子级检查） */
    @PostMapping("/permission/delete")
    @Operation(summary = "删除权限", description = "参数: id，会检查是否有子级权限")
    public Result<?> delete(@RequestBody Map<String, Object> params) {
        try {
            permissionService.delete(toLong(params.get("id"), 0));
            return Result.ok();
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    /** 权限树 */
    @PostMapping("/permission/tree")
    @Operation(summary = "权限树", description = "以树形结构返回所有权限")
    public Result<?> permissionsTree(@RequestBody Map<String, Object> params) {
        return Result.ok(permissionService.permissionsTree(params));
    }

    /** 拖拽排序/移动权限节点 */
    @PostMapping("/permission/drop")
    @Operation(summary = "拖拽排序", description = "拖拽移动权限节点位置")
    public Result<?> drop(@RequestBody Map<String, Object> params) {
        try {
            permissionService.drop(params);
            return Result.ok();
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
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
