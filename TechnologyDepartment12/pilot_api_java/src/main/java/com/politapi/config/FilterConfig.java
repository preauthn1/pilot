package com.politapi.config;

import com.politapi.filter.DocsAuthFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 注册文档认证过滤器，保护以下路径：
 *   /docs          → 文档导航首页
 *   /docs.html     → 文档导航首页
 *   /api-docs.html → 交互式接口文档
 *   /v3/api-docs   → OpenAPI JSON
 *   /pilot_api.postman_collection.json → Postman 集合
 *   /API_DOCUMENTATION.md → Markdown 文档
 */
@Configuration
public class FilterConfig {

    @Bean
    public FilterRegistrationBean<DocsAuthFilter> docsAuthFilterRegistration(DocsAuthFilter filter) {
        FilterRegistrationBean<DocsAuthFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(filter);
        registration.addUrlPatterns(
                "/docs",
                "/docs.html",
                "/api-docs.html",
                "/v1/api-docs",
                "/pilot_api.postman_collection.json",
                "/API_DOCUMENTATION.md"
        );
        registration.setOrder(1);
        return registration;
    }
}
