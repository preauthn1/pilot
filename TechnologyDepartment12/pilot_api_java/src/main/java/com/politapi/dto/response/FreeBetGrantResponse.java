package com.politapi.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 发放免费次数响应 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "发放免费次数响应")
public class FreeBetGrantResponse {

    @Schema(description = "用户ID", example = "10001")
    private Long userId;

    @Schema(description = "剩余免费次数", example = "10")
    private Integer remainCount;

    @Schema(description = "本次发放次数", example = "5")
    private Integer grantedCount;

    @Schema(description = "单次免费下注金额（分）", example = "1000")
    private Long freeBetAmount;

    @Schema(description = "流水倍数", example = "1")
    private Integer multiple;
}
