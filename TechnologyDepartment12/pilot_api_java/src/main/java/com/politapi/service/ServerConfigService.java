package com.politapi.service;

import java.util.Map;

/**
 * 服务器配置服务接口
 */
public interface ServerConfigService {

    /** 分页查询服务器配置列表 */
    Map<String, Object> getServerConfigList(Map<String, Object> params);

    /** 创建服务器配置 */
    Long create(Map<String, String> params);

    /** 更新服务器配置 */
    void update(Map<String, String> params);
}
