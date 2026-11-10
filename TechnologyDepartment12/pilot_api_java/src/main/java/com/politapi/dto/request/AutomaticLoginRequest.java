package com.politapi.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 自动登录请求 DTO
 */
@Data
@Schema(description = "自动登录请求（无需提前创建用户，自动生成用户名并上分）")
public class AutomaticLoginRequest {

    @Schema(description = "用户名（为空时自动生成 \"U\"+时间戳）", example = "")
    private String username;

    @Schema(description = "渠道名称", example = "channel_tiktok", requiredMode = Schema.RequiredMode.REQUIRED)
    private String channel;

    @Schema(description = "币种", example = "INR")
    private String currency;

    @Schema(description = "上分金额（分），默认 1000000", example = "500000")
    private Long money;

    @Schema(description = "扩展字段", example = "")
    private String expand;

    @JsonAlias("game_code")
    @Schema(description = "游戏代码，可选；用于下游大厅指定进入的游戏", example = "dice")
    private String gameCode;
}
