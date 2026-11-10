package com.politapi.controller;

import com.politapi.common.Result;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller 公共基类，提供通用辅助方法
 * <p>
 * 避免在每个 Controller 中重复定义 toLong、fail 等方法
 * </p>
 */
@Slf4j
public abstract class BaseController {

    // ==================== 成功响应 ====================

    protected <T> Result<T> success(T data) {
        return Result.ok(data);
    }

    protected <T> Result<T> success() {
        return Result.ok();
    }

    // ==================== 失败响应 ====================

    protected <T> Result<T> fail(String message) {
        return Result.fail(500, message);
    }

    protected <T> Result<T> fail(int code, String message) {
        return Result.fail(code, message);
    }

    // ==================== 类型转换 ====================

    /**
     * 安全地将 Object 转为 Long，转换失败返回默认值
     */
    protected Long toLong(Object val, long defaultVal) {
        if (val == null) {
            return defaultVal;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        try {
            return Long.parseLong(val.toString());
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    /**
     * 安全地将 Object 转为 Integer，转换失败返回 null
     */
    protected Integer toInteger(Object val) {
        if (val == null) {
            return null;
        }
        if (val instanceof Number) {
            return ((Number) val).intValue();
        }
        try {
            return Integer.parseInt(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
