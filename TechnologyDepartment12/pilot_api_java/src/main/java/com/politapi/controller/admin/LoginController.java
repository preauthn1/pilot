package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.dto.request.AdminLoginRequest;
import com.politapi.entity.Admin;
import com.politapi.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 管理后台 - 登录认证接口（兼容 Vue Vben Admin 5.x 前端）
 * <p>
 * 响应格式: { "code": 0, "message": "success", "data": ... }
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "管理后台登录", description = "管理员登录、登出、获取用户信息/菜单/权限")
public class LoginController {

    @Autowired
    private AdminService adminService;

    @PostMapping("/login")
    @Operation(summary = "管理员登录", description = "用户名+密码 → JWT accessToken")
    public Result<?> login(@RequestBody AdminLoginRequest req) {
        Admin admin = adminService.login(req.getUsername(), req.getPassword());
        if (admin == null) {
            return Result.fail(401, "invalid credentials");
        }
        String token = adminService.generateToken(admin);
        Map<String, Object> data = new HashMap<>();
        data.put("accessToken", token);
        return Result.ok(data);
    }

    @PostMapping("/logout")
    @Operation(summary = "退出登录")
    public Result<?> logout() {
        return Result.ok();
    }

    @PostMapping("/refresh")
    @Operation(summary = "刷新 Token", description = "用旧 token 换新 token")
    public Result<?> refreshToken(HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId == null) {
            return Result.fail(401, "not logged in");
        }
        Admin admin = adminService.getAdmin(adminId);
        if (admin == null) {
            return Result.fail(401, "admin not found");
        }
        String token = adminService.generateToken(admin);
        Map<String, Object> data = new HashMap<>();
        data.put("accessToken", token);
        return Result.ok(data);
    }

    @GetMapping("/info")
    @Operation(summary = "获取当前用户信息", description = "返回 { realName, roles, avatar, platformId, accessedRoutes }")
    public Result<?> getUserInfo(HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId == null) {
            return Result.fail(401, "not logged in");
        }
        try {
            Map<String, Object> me = adminService.me(adminId);
            Map<String, Object> data = new HashMap<>();
            data.put("realName", me.getOrDefault("name", ""));
            data.put("roles", Collections.singletonList(me.getOrDefault("roleId", "0")));
            data.put("avatar", "");
            data.put("platformId", me.getOrDefault("platformId", "0"));
            data.put("isPackage", me.getOrDefault("isPackage", 0));
            data.put("packageIds", me.getOrDefault("packageIds", ""));
            data.put("accessedRoutes", me.getOrDefault("accessedRoutes", Collections.emptyList()));
            return Result.ok(data);
        } catch (IllegalArgumentException e) {
            return Result.fail(401, e.getMessage());
        }
    }

    @GetMapping("/codes")
    @Operation(summary = "获取权限码", description = "返回当前管理员的权限码列表（字符串数组）")
    public Result<?> getAuthCodes(HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId == null) {
            return Result.fail(401, "not logged in");
        }
        List<String> permIds = adminService.getPermIdsAsString(adminId);
        return Result.ok(permIds);
    }

    @GetMapping("/menu/all")
    @Operation(summary = "获取菜单", description = "返回当前管理员可访问的菜单路由列表")
    public Result<?> getMenus(HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId == null) {
            return Result.fail(401, "not logged in");
        }
        try {
            Map<String, Object> me = adminService.me(adminId);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> routes = (List<Map<String, Object>>) me.getOrDefault("accessedRoutes", Collections.emptyList());
            return Result.ok(routes);
        } catch (IllegalArgumentException e) {
            return Result.fail(401, e.getMessage());
        }
    }
}
