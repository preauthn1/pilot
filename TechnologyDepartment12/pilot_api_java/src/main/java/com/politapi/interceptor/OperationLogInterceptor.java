package com.politapi.interceptor;
import com.politapi.util.LogUtil;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
/**
 * 操作日志拦截器 - 记录管理后台每次请求的操作人及路径
 */
public class OperationLogInterceptor implements HandlerInterceptor {

    /**
     * 请求前拦截，记录操作日志（adminId + 请求路径）
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId != null) {
            LogUtil.write("adminId=" + adminId + " path=" + request.getRequestURI(), "operation", "admin");
        }
        return true;
    }
}