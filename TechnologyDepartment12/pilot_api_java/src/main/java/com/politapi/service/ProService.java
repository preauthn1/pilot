package com.politapi.service;

import com.alibaba.fastjson.JSONObject;

import java.util.Map;

/**
 * 游戏核心服务接口 - 负责余额查询、下注、取消下注、结算等核心游戏逻辑
 */
public interface ProService {

    /**
     * 查询用户余额
     */
    JSONObject getBalance(Map<String, Object> params);

    /**
     * 下注
     */
    JSONObject bet(Map<String, Object> params);

    /**
     * 取消下注（退款）
     */
    JSONObject unbet(Map<String, Object> params);

    /**
     * 结算
     */
    JSONObject settle(Map<String, Object> params);
}
