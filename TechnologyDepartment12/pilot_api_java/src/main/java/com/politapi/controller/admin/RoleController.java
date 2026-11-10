package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 角色管理
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "角色管理", description = "角色 CRUD、查询所有角色")
public class RoleController {

    @Autowired
    private RoleService roleService;

    /** 分页查询角色列表 */
    @PostMapping("/roles")
    @Operation(summary = "角色列表", description = "分页查询角色")
    public Result<?> roles(@RequestBody Map<String, Object> params) {
        return Result.ok(roleService.roles(params));
    }

    /** 查询单个角色详情 */
    @PostMapping("/role")
    @Operation(summary = "查询角色", description = "根据 id 查询单个角色")
    public Result<?> role(@RequestBody Map<String, Object> params) {
        return Result.ok(roleService.getRole(toLong(params.get("id"), 0)));
    }

    /** 创建角色 */
    @PostMapping("/role/create")
    @Operation(summary = "创建角色")
    public Result<?> create(@RequestBody Map<String, String> params) {
        return Result.ok(roleService.create(params));
    }

    /** 更新角色 */
    @PostMapping("/role/update")
    @Operation(summary = "更新角色")
    public Result<?> update(@RequestBody Map<String, String> params) {
        roleService.update(params);
        return Result.ok();
    }

    /** 删除角色 */
    @PostMapping("/role/delete")
    @Operation(summary = "删除角色", description = "参数: id")
    public Result<?> delete(@RequestBody Map<String, Object> params) {
        roleService.delete(toLong(params.get("id"), 0));
        return Result.ok();
    }

    /** 查询所有角色 */
    @PostMapping("/role/all")
    @Operation(summary = "全部角色", description = "返回所有角色列表")
    public Result<?> allRoles(@RequestBody Map<String, Object> params) {
        return Result.ok(roleService.allRoles(params));
    }

    /** 分配角色权限 */
    @PostMapping("/role/assignPermissions")
    @Operation(summary = "分配角色权限", description = "参数: id(角色ID), permissionIds(逗号分隔的权限ID)")
    public Result<?> assignPermissions(@RequestBody Map<String, Object> params) {
        Long roleId = toLong(params.get("id"), 0);
        String permissionIds = (String) params.get("permissionIds");
        if (roleId == 0) {
            return Result.fail("缺少角色ID");
        }
        roleService.assignPermissions(roleId, permissionIds);
        return Result.ok();
    }

    /** 查询角色已有权限ID */
    @PostMapping("/role/permissions")
    @Operation(summary = "查询角色权限", description = "参数: id(角色ID)，返回该角色已分配的权限ID列表")
    public Result<?> rolePermissions(@RequestBody Map<String, Object> params) {
        Long roleId = toLong(params.get("id"), 0);
        if (roleId == 0) {
            return Result.fail("缺少角色ID");
        }
        return Result.ok(roleService.getPermissionIds(roleId));
    }

    /** 同步角色权限（预留） */
    @PostMapping("/role/syncPermissions")
    @Operation(summary = "同步角色权限（预留）")
    public Result<?> syncPermissions(@RequestBody Map<String, Object> params) {
        return Result.ok();
    }

    /** 同步角色（预留） */
    @PostMapping("/role/syncRoles")
    @Operation(summary = "同步角色（预留）")
    public Result<?> syncRoles(@RequestBody Map<String, Object> params) {
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
