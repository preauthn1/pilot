package com.politapi.service;

import com.politapi.common.Result;
import java.util.Map;

/**
 * 游戏服务器配置服务
 */
public interface GameServerConfigService {

    int ERROR_TOKEN = 106;
    int NO_EXIST_CHANNEL = 201;

    Result<Map<String, Object>> getServerConfig(Map<String, Object> params);
}
