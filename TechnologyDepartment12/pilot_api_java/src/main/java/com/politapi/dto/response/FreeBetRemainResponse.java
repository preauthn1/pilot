package com.politapi.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 查询剩余免费次数响应 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "查询剩余免费次数响应")
public class FreeBetRemainResponse {

    @Schema(description = "剩余免费次数", example = "10")
    private Integer remainCount;

    @Schema(description = "单次免费下注金额（分）", example = "1000")
    private Long freeBetAmount;

    @Schema(description = "最近到期时间，格式 yyyy-MM-dd HH:mm:ss", example = "2026-06-30 23:59:59", nullable = true)
    private String expireAt;
}
