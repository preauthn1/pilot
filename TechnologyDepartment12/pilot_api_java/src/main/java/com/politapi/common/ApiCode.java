package com.politapi.common;

/**
 * 统一 API 响应状态码
 * <p>
 * 集中管理所有接口返回的状态码，便于前后端对照与维护。
 * </p>
 */
public class ApiCode {

    /** 操作成功 */
    public static final int SUCCESS = 0;

    /** 未知错误 */
    public static final int ERROR_UNKNOWN = 1;

    /** Token 过期 */
    public static final int TOKEN_EXPIRED = 401;

    /** 未授权 / 无权限 */
    public static final int UNAUTHORIZED = 403;

    /** 缺少必要参数 */
    public static final int MISSING_PARAM = 1001;

    /** 用户不存在 */
    public static final int USER_NOT_FOUND = 2001;

    /** 渠道不存在 */
    public static final int CHANNEL_NOT_FOUND = 2002;

    /** 余额不足 */
    public static final int INSUFFICIENT_BALANCE = 3001;

    /** 下注失败 */
    public static final int BET_FAILED = 3002;

    /** 结算失败 */
    public static final int SETTLE_FAILED = 3003;
}
