package com.politapi.config;

import com.politapi.interceptor.IpWhitelistInterceptor;
import com.politapi.interceptor.JwtInterceptor;
import com.politapi.interceptor.OperationLogInterceptor;
import com.politapi.interceptor.RequestLogInterceptor;
import com.politapi.mapper.AdminMapper;
import com.politapi.mapper.RoleMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置 - 拦截器 & 跨域
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private IpWhitelistInterceptor ipWhitelistInterceptor;

    @Autowired
    private AdminMapper adminMapper;

    @Autowired
    private RoleMapper roleMapper;

    /**
     * 配置 CORS 跨域，允许前端开发服务器访问
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    /**
     * 注册拦截器：IP白名单 → 请求日志 → JWT 鉴权 → 操作日志
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // IP 白名单拦截器（受 ip.whitelist.enabled 配置控制）
        registry.addInterceptor(ipWhitelistInterceptor)
                .addPathPatterns("/**");
        // 请求日志拦截器（打印所有请求到控制台）
        registry.addInterceptor(new RequestLogInterceptor())
                .addPathPatterns("/**");
        // JWT 鉴权拦截器（admin 管理后台）
        registry.addInterceptor(new JwtInterceptor(adminMapper, roleMapper))
                .addPathPatterns("/admin/**")
                .excludePathPatterns("/admin/login", "/admin/common/serverTime");
        // 操作日志拦截器
        registry.addInterceptor(new OperationLogInterceptor())
                .addPathPatterns("/admin/**")
                .excludePathPatterns("/admin/login", "/admin/common/serverTime");
    }
}