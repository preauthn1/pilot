package com.politapi.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 文档页面 HTTP Basic 认证过滤器
 * 保护 /docs /api-docs.html /v3/api-docs 等文档访问路径
 */
@Component
public class DocsAuthFilter implements Filter {

    @Value("${docs.auth.username:admin}")
    private String username;

    @Value("${docs.auth.password:pilot2024}")
    private String password;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String authHeader = req.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Basic ")) {
            String base64Credentials = authHeader.substring(6);
            String credentials = new String(Base64.getDecoder().decode(base64Credentials), StandardCharsets.UTF_8);
            String[] parts = credentials.split(":", 2);
            if (parts.length == 2 && username.equals(parts[0]) && password.equals(parts[1])) {
                chain.doFilter(request, response);
                return;
            }
        }

        res.setHeader("WWW-Authenticate", "Basic realm=\"API Docs\", charset=\"UTF-8\"");
        res.setStatus(401);
        res.setContentType("text/html; charset=UTF-8");
        res.getWriter().write("""
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head><meta charset="UTF-8"><title>需要认证</title>
                <style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;text-align:center;flex-direction:column;gap:12px;}
                h1{font-size:24px;color:#f87171}.desc{color:#94a3b8;font-size:14px}</style></head>
                <body><h1>401 — 需要认证</h1><p class="desc">请输入账号密码访问接口文档</p></body></html>
                """);
    }
}
