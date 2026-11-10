package com.politapi.service;

import com.politapi.entity.SystemConfig;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * 系统配置服务接口
 */
public interface SystemConfigService extends IService<SystemConfig> {
    Map<String, Object> getSystemConfigList(Map<String, Object> params);
    Long create(Map<String, String> params);
    void update(Map<String, String> params);
    void delete(Long id);
}
