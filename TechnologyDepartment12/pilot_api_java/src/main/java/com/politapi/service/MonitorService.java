package com.politapi.service;

import java.util.Map;

/**
 * 实时监控服务接口
 */
public interface MonitorService {

    /**
     * 监控登录，生成 AES Token 并返回当日盈亏
     */
    Map<String, Object> monitorLogin(Long adminId, String gameCode);
}
