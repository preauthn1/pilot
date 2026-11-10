package com.politapi.service;

import com.politapi.entity.CoinLog;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * 币种日志服务接口
 */
public interface CoinLogService extends IService<CoinLog> {
    Map<String, Object> getCoinLogList(Map<String, Object> params);
}
