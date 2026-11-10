package com.politapi.util;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

/**
 * HTTP 请求工具
 */
public class HttpUtil {

    /**
     * 发送 JSON POST 请求
     *
     * @param url  请求地址
     * @param body 请求体（会被序列化为 JSON）
     * @return 响应 JSON 对象
     */
    public static JSONObject postJson(String url, Object body) {
        try {
            HttpResponse response = HttpRequest.post(url)
                    .header("Content-Type", "application/json; charset=utf-8")
                    .body(JSON.toJSONString(body))
                    .timeout(30000)
                    .execute();
            return JSON.parseObject(response.body());
        } catch (Exception e) {
            JSONObject err = new JSONObject();
            err.put("code", -1);
            err.put("msg", "HTTP request failed: " + e.getMessage());
            return err;
        }
    }

    /**
     * 发送 GET 请求
     *
     * @param url 请求地址
     * @return 响应 JSON 对象
     */
    public static JSONObject get(String url) {
        try {
            HttpResponse response = HttpRequest.get(url).timeout(30000).execute();
            return JSON.parseObject(response.body());
        } catch (Exception e) {
            JSONObject err = new JSONObject();
            err.put("code", -1);
            err.put("msg", "HTTP request failed: " + e.getMessage());
            return err;
        }
    }
}
