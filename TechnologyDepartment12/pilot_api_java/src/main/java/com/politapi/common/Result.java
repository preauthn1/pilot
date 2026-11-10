package com.politapi.common;

import com.alibaba.fastjson.JSON;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 统一 API 响应结果封装
 *
 * @param <T> 响应数据类型
 */
public class Result<T> {

    /** 状态码 */
    private int code;

    /** 提示信息 */
    @JsonProperty("message")
    private String msg;

    /** 响应数据 */
    private T data;

    // ==================== 静态工厂方法 ====================

    /**
     * 成功响应（带数据）
     *
     * @param data 响应数据
     * @param <T>  数据类型
     * @return 成功结果
     */
    public static <T> Result<T> ok(T data) {
        Result<T> r = new Result<>();
        r.code = 0;
        r.msg = "success";
        r.data = data;
        return r;
    }

    /**
     * 成功响应（无数据）
     *
     * @param <T> 数据类型
     * @return 成功结果
     */
    public static <T> Result<T> ok() {
        return ok(null);
    }

    /**
     * 失败响应
     *
     * @param code 错误码
     * @param msg  错误信息
     * @param <T>  数据类型
     * @return 失败结果
     */
    public static <T> Result<T> fail(int code, String msg) {
        Result<T> r = new Result<>();
        r.code = code;
        r.msg = msg;
        return r;
    }

    /**
     * 失败响应（默认错误码 1）
     *
     * @param msg 错误信息
     * @param <T> 数据类型
     * @return 失败结果
     */
    public static <T> Result<T> fail(String msg) {
        return fail(1, msg);
    }

    /**
     * 将当前结果序列化为 JSON 字符串
     *
     * @return JSON 字符串
     */
    public String toJson() {
        return JSON.toJSONString(this);
    }

    // ==================== Getter / Setter ====================

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
