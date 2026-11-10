package com.politapi.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * 日期时间工具
 */
public class DateUtil {

    public static final DateTimeFormatter STANDARD = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    public static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    public static String format(LocalDateTime dt) {
        return dt != null ? dt.format(STANDARD) : "";
    }

    public static LocalDateTime parse(String s) {
        return s != null && !s.isEmpty() ? LocalDateTime.parse(s, STANDARD) : null;
    }

    public static long nowTimestamp() {
        return System.currentTimeMillis() / 1000;
    }

    /** 秒级时间戳 → "yyyy-MM-dd HH:mm:ss" */
    public static String formatEpoch(long epochSecond) {
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSecond), ZONE).format(STANDARD);
    }

    /**
     * 时间字符串 → 秒级时间戳。支持纯数字（自动识别毫秒）或 "yyyy-MM-dd HH:mm:ss"。
     * @return 秒级时间戳，解析失败返回 0
     */
    public static long toEpochSecond(String s) {
        if (s == null || s.isEmpty()) {
            return 0;
        }
        try {
            if (s.matches("\\d+")) {
                long ts = Long.parseLong(s);
                return ts > 1_000_000_000_000L ? ts / 1000 : ts;
            }
            return LocalDateTime.parse(s, STANDARD).atZone(ZONE).toEpochSecond();
        } catch (Exception e) {
            return 0;
        }
    }
}
