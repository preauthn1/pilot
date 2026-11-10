package com.politapi.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/**
 * JWT Token 工具 - 负责 Token 生成、解析与校验
 */
public class JwtUtil {

    /** 签名密钥（至少 256 位 / 32 字节） */
    private static final String SECRET = "polit-api-jwt-secret-key-2024-256bits!!";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    private static final long EXPIRATION = 86400000L; // 24 小时

    /**
     * 生成 JWT Token
     *
     * @param adminId 管理员 ID
     * @param claims  附加信息
     * @return Token 字符串
     */
    public static String generateToken(Long adminId, Map<String, Object> claims) {
        return Jwts.builder()
                .claims(claims)
                .subject(String.valueOf(adminId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(KEY)
                .compact();
    }

    /**
     * 解析 Token
     */
    public static Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(KEY)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 从 Token 中获取管理员 ID
     */
    public static Long getAdminId(String token) {
        return Long.parseLong(parseToken(token).getSubject());
    }

    /**
     * 判断 Token 是否过期
     */
    public static boolean isExpired(String token) {
        try {
            return parseToken(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
}
