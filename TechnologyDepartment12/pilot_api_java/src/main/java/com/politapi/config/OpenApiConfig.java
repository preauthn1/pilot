package com.politapi.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI politApiOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Pilot 游戏平台 API")
                        .description("对外开放接口。在线调试：点击接口 -> Try it out -> 填写参数 -> Execute")
                        .version("v1.0")
                        .contact(new Contact().name("技术支持").email("dev@polit.com")));
    }

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("all")
                .pathsToMatch("/**")
                .pathsToExclude("/admin/**")
                .build();
    }
}
