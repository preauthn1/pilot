package com.politapi.interceptor;

import com.alibaba.fastjson.JSON;
import com.politapi.common.Result;
import com.politapi.context.AdminContext;
import com.politapi.entity.Admin;
import com.politapi.mapper.AdminMapper;
import com.politapi.mapper.RoleMapper;
import com.politapi.util.JwtUtil;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * JWT 鉴权拦截器 - 校验请求头中的 token，加载管理员信息到 AdminContext
 */
public class JwtInterceptor implements HandlerInterceptor {

    private final AdminMapper adminMapper;
    private final RoleMapper roleMapper;

    public JwtInterceptor(AdminMapper adminMapper, RoleMapper roleMapper) {
        this.adminMapper = adminMapper;
        this.roleMapper = roleMapper;
    }

    /**
     * 请求前校验 JWT Token，从请求头 token 或 Authorization 中获取，
     * 校验通过后将 adminId 写入 request attribute，加载 Admin 和 Role 信息写入 AdminContext
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String token = request.getHeader("token");
        if (token == null || token.isEmpty()) {
            token = request.getHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
        }
        if (token == null || token.isEmpty()) {
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(JSON.toJSONString(Result.fail(401, "no token")));
            return false;
        }
        if (JwtUtil.isExpired(token)) {
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(JSON.toJSONString(Result.fail(401, "token expired")));
            return false;
        }
        Long adminId = JwtUtil.getAdminId(token);
        request.setAttribute("adminId", adminId);
        Admin admin = adminMapper.selectById(adminId);
        if (admin != null) {
            AdminContext.set(admin);
            // 加载角色信息，判断数据权限范围
            if (admin.getRoleId() != null && admin.getRoleId() != 0) {
                com.politapi.entity.Role role = roleMapper.selectById(admin.getRoleId());
                AdminContext.setFullDataScope(role != null && role.getDataScope() != null && role.getDataScope() == 1);
            } else {
                // roleId 为 0 或无角色 → 超级管理员，全数据权限
                AdminContext.setFullDataScope(true);
            }
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        AdminContext.clear();
    }
}