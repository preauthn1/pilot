package com.politapi.service;

import java.util.Map;

/**
 * 通用接口服务（字典下拉等）
 */
public interface CommonService {

    /**
     * 动态字典映射 — 前端通过 dict_names 参数按需获取下拉数据
     */
    Map<String, Object> dictMaps(Map<String, Object> params);
}
