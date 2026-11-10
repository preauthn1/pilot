package com.politapi.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 用户登录请求 DTO（商户端调用）
 */
@Data
@Schema(description = "用户登录请求")
public class LoginRequest {

    @Schema(description = "用户名", example = "player001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @Schema(description = "渠道名称", example = "channel_tiktok", requiredMode = Schema.RequiredMode.REQUIRED)
    private String channel;

    @Schema(description = "币种，默认 INR", example = "INR")
    private String currency;

    @Schema(description = "扩展字段（JSON）", example = "")
    private String expand;

    @JsonAlias("game_code")
    @Schema(description = "游戏代码，可选；用于下游大厅指定进入的游戏", example = "dice")
    private String gameCode;
}
