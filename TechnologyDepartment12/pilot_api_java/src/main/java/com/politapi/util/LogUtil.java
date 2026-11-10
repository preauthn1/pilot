package com.politapi.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 审计日志工具 — 将操作记录写入独立的审计日志文件。
 * <p>
 * 由 logback-spring.xml 中名为 "AUDIT" 的 logger 接管输出，
 * 自动享受 RollingFile 轮转、gzip 归档、按端口隔离等能力。
 * </p>
 */
public class LogUtil {

    private static final Logger AUDIT = LoggerFactory.getLogger("AUDIT");

    /**
     * 写入审计日志。
     *
     * @param message  日志内容
     * @param fileName 分类标识（原用于文件名，现作为日志标签）
     * @param subDir   子目录标识（现作为日志标签）
     */
    public static void write(String message, String fileName, String subDir) {
        AUDIT.info("[{}/{}] {}", subDir, fileName, message);
    }
}
