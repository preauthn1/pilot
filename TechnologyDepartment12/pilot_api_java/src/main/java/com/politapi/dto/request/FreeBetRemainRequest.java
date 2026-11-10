package com.politapi.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 查询剩余免费次数请求 DTO
 */
@Data
@Schema(description = "查询剩余免费次数请求")
public class FreeBetRemainRequest {

    @NotBlank(message = "用户名不能为空")
    @Schema(description = "用户名", example = "player001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @NotBlank(message = "渠道不能为空")
    @Schema(description = "渠道名称或ID", example = "channel_001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String channel;

    @NotBlank(message = "签名不能为空")
    @Schema(description = "请求签名", requiredMode = Schema.RequiredMode.REQUIRED)
    private String sign;
}
