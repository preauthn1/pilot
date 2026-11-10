package com.politapi;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 项目启动类
 * <p>
 * 负责 Spring Boot 应用初始化，配置 MyBatis 映射器扫描路径及启用缓存支持。
 * </p>
 */
@SpringBootApplication
@MapperScan("com.politapi.mapper")
@EnableCaching
@EnableScheduling
public class PolitApiApplication {

    /**
     * Spring Boot 应用入口
     */
    public static void main(String[] args) {
        SpringApplication.run(PolitApiApplication.class, args);
    }
}
