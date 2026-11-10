package com.politapi.interceptor;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.UUID;

/**
 * 请求日志拦截器 — 为每次请求注入 traceId（MDC），
 * 并在控制台打印请求方法、URI、IP、状态码及耗时。
 */
@Slf4j
public class RequestLogInterceptor implements HandlerInterceptor {

    private static final String TRACE_ID_KEY = "traceId";

    /**
     * 请求前：生成 traceId 放入 MDC，记录请求信息并标记开始时间。
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 生成短 traceId（UUID 前 8 位），贯穿整个请求生命周期
        String traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        MDC.put(TRACE_ID_KEY, traceId);
        request.setAttribute(TRACE_ID_KEY, traceId);

        String method = request.getMethod();
        String uri = request.getRequestURI();
        String query = request.getQueryString();
        String ip = getClientIp(request);

        if (query != null) {
            log.info("--> [{}] {}?{}  [IP: {}]", method, uri, query, ip);
        } else {
            log.info("--> [{}] {}  [IP: {}]", method, uri, ip);
        }

        // 记录开始时间，便于计算耗时
        request.setAttribute("requestStartTime", System.currentTimeMillis());
        return true;
    }

    /**
     * 请求完成后：记录响应状态码与耗时，清理 MDC。
     */
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        Long startTime = (Long) request.getAttribute("requestStartTime");
        long cost = startTime != null ? System.currentTimeMillis() - startTime : 0;
        int status = response.getStatus();

        log.info("<-- [{}] {}  status={}  cost={}ms",
                request.getMethod(), request.getRequestURI(), status, cost);

        // 清理 MDC，防止线程池复用时污染
        MDC.remove(TRACE_ID_KEY);
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
        // 多级代理时取第一个 IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
