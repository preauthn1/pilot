package com.politapi.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 创建用户请求 DTO（商户端调用）
 */
@Data
@Schema(description = "创建用户请求")
public class CreateUserRequest {

    @Schema(description = "用户名", example = "player002", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @Schema(description = "商户ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private String merchantId;

    @Schema(description = "渠道ID", example = "5")
    private Long channelId;

    @Schema(description = "币种，默认 USDT", example = "USDT")
    private String currency;

    @Schema(description = "扩展字段（JSON）", example = "")
    private String expand;

    @Schema(description = "用户IP", example = "")
    private String ip;
}
