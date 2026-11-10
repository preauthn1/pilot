package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 管理员管理
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "管理员管理", description = "管理员 CRUD、修改密码、重置密码")
public class AdminManagerController {

    @Autowired
    private AdminService adminService;

    /** 分页查询管理员列表 */
    @PostMapping("/admins")
    @Operation(summary = "管理员列表", description = "分页查询管理员，参数: offset, limit, name, roleId")
    public Result<?> admins(@RequestBody Map<String, Object> params) {
        return Result.ok(adminService.admins(params));
    }

    /** 查询单个管理员详情 */
    @PostMapping("/admin")
    @Operation(summary = "查询管理员", description = "根据 id 查询单个管理员详情")
    public Result<?> admin(@RequestBody Map<String, Object> params) {
        Long id = toLong(params.get("id"), 0);
        return Result.ok(adminService.getAdmin(id));
    }

    /** 创建管理员 */
    @PostMapping("/admin/create")
    @Operation(summary = "创建管理员", description = "参数: name, password, roleId")
    public Result<?> create(@RequestBody Map<String, String> params) {
        try {
            return Result.ok(adminService.createAdmin(params));
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    /** 更新管理员 */
    @PostMapping("/admin/update")
    @Operation(summary = "更新管理员", description = "参数: id, name, roleId")
    public Result<?> update(@RequestBody Map<String, String> params) {
        try {
            adminService.updateAdmin(params);
            return Result.ok();
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    /** 删除管理员 */
    @PostMapping("/admin/delete")
    @Operation(summary = "删除管理员", description = "参数: id")
    public Result<?> delete(@RequestBody Map<String, Object> params) {
        adminService.deleteAdmin(toLong(params.get("id"), 0));
        return Result.ok();
    }

    /** 修改当前管理员密码 */
    @PostMapping("/admin/updatePassword")
    @Operation(summary = "修改密码", description = "当前登录管理员修改自己的密码，参数: password")
    public Result<?> updatePassword(@RequestBody Map<String, String> params, HttpServletRequest request) {
        Long id = (Long) request.getAttribute("adminId");
        if (id == null) {
            return Result.fail(401, "not logged in");
        }
        try {
            adminService.updatePassword(id, params.get("password"));
            return Result.ok();
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    /** 重置指定管理员密码 */
    @PostMapping("/admin/reset")
    @Operation(summary = "重置密码", description = "重置指定管理员的密码，参数: id")
    public Result<?> reset(@RequestBody Map<String, String> params) {
        Long id = toLong(params.get("id"), 0);
        if (id == 0) {
            return Result.fail(400, "参数不完整");
        }
        adminService.resetPassword(id);
        return Result.ok();
    }

    /** 更新自身信息（预留） */
    @PostMapping("/admin/updateSelf")
    @Operation(summary = "更新自身信息（预留）")
    public Result<?> updateSelf(@RequestBody Map<String, String> params) {
        return Result.ok();
    }

    /** 同步权限（预留） */
    @PostMapping("/admin/syncPermissions")
    @Operation(summary = "同步权限（预留）")
    public Result<?> syncPermissions(@RequestBody Map<String, Object> params) {
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
