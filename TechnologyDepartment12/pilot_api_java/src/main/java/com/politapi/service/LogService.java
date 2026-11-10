package com.politapi.service;

import java.util.Map;

/**
 * 操作日志服务接口
 */
public interface LogService {

    /**
     * 分页查询管理员操作日志（联查管理员名称）
     */
    Map<String, Object> adminOperationLog(Map<String, Object> params);
}
