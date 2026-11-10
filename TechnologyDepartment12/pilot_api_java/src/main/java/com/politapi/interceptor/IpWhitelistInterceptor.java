package com.politapi.interceptor;

import com.alibaba.fastjson.JSON;
import com.politapi.common.Result;
import com.politapi.service.IpListService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * IP 白名单校验拦截器
 * <p>
 * 受 {@code ip.whitelist.enabled} 配置项控制，默认关闭。
 * 开启后，根据请求路径区分校验字段：
 * <ul>
 *   <li>{@code /admin/**} → 查 {@code admin_status=1} 的记录</li>
 *   <li>其他路径       → 查 {@code api_status=1} 的记录</li>
 * </ul>
 * 若对应类型下没有任何启用记录，则放行所有请求（防止锁死）。
 */
@Slf4j
@Component
public class IpWhitelistInterceptor implements HandlerInterceptor {

    @Value("${ip.whitelist.enabled:false}")
    private boolean enabled;

    @Autowired
    private IpListService ipListService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws Exception {
        if (!enabled) {
            return true;
        }

        String clientIp = getClientIp(request);
        String uri = request.getRequestURI();

        // 根据路径前缀确定校验类型
        String pathType = uri.startsWith("/admin/") ? "admin" : "api";

        if (!ipListService.isIpAllowed(clientIp, pathType)) {
            log.warn("IP whitelist rejected: {} → {} {}", clientIp, request.getMethod(), uri);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(JSON.toJSONString(
                    Result.fail(403, "IP not in whitelist")));
            return false;
        }

        return true;
    }

    /**
     * 获取客户端真实 IP（考虑反向代理）
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
