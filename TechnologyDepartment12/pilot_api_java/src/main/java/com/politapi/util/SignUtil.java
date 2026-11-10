package com.politapi.util;

import cn.hutool.crypto.SecureUtil;

import java.math.BigDecimal;
import java.util.Map;
import java.util.TreeMap;

/**
 * 签名工具 - 用于接口请求参数的 MD5 签名生成与校验
 */
public class SignUtil {

    /**
     * 生成 MD5 签名
     * <p>
     * 按参数名排序后拼接 key=secret，最后取 MD5 小写
     * </p>
     *
     * @param params 请求参数
     * @param secret 签名密钥
     * @return 小写 MD5 签名字符串
     */
    public static String generateSign(Map<String, Object> params, String secret) {
        TreeMap<String, Object> sorted = new TreeMap<>(params);
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> entry : sorted.entrySet()) {
            if (entry.getValue() != null) {
                sb.append(entry.getKey()).append("=").append(formatValue(entry.getValue())).append("&");
            }
        }
        sb.append("key=").append(secret);
        return SecureUtil.md5(sb.toString()).toLowerCase();
    }

    /**
     * 格式化参数值：
     *   Number 类型 → 整数去掉 ".0"（5.0 → "5"），小数去尾部零
     *   String/其他 → 原样返回（ID/订单号绝不转数字，避免精度丢失）
     */
    private static String formatValue(Object value) {
        if (value instanceof Number) {
            BigDecimal bd = new BigDecimal(value.toString());
            if (bd.stripTrailingZeros().scale() <= 0) {
                return bd.toBigInteger().toString();
            }
            return bd.stripTrailingZeros().toPlainString();
        }
        return value.toString();
    }

    /**
     * 校验签名
     */
    public static boolean verifySign(Map<String, Object> params, String secret, String sign) {
        String generated = generateSign(params, secret);
        return generated.equalsIgnoreCase(sign);
    }
}
