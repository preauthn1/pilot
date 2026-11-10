package com.politapi.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 发放免费次数请求 DTO
 */
@Data
@Schema(description = "发放免费次数请求")
public class FreeBetGrantRequest {

    @NotBlank(message = "用户ID不能为空")
    @Schema(description = "用户ID", example = "50", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @NotBlank(message = "渠道不能为空")
    @Schema(description = "渠道名称或ID", example = "channel_001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String channel;

    @NotNull(message = "发放次数不能为空")
    @Schema(description = "发放次数", example = "5", requiredMode = Schema.RequiredMode.REQUIRED, minimum = "1")
    private Integer count;

    @NotNull(message = "流水倍数不能为空")
    @Schema(description = "流水倍数", example = "1", requiredMode = Schema.RequiredMode.REQUIRED, minimum = "1")
    private Integer multiple;

    @JsonProperty("gameCode")
    @JsonAlias("game_code")
    @Schema(description = "游戏代码。传入时免费次数仅限该游戏；不传则所有游戏可用", example = "dice", nullable = true)
    private String gameCode;

    @NotBlank(message = "活动ID不能为空")
    @Schema(description = "上游活动ID", example = "act_20240618_001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String activityId;

    @NotBlank(message = "上游订单号不能为空")
    @Schema(description = "上游发放单号（幂等键）", example = "ord_20240618_001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String sourceOrderId;

    @Schema(description = "过期时间，格式 yyyy-MM-dd HH:mm:ss", example = "2026-06-30 23:59:59", nullable = true)
    private String expireAt;

    @NotBlank(message = "签名不能为空")
    @Schema(description = "请求签名", requiredMode = Schema.RequiredMode.REQUIRED)
    private String sign;

    @Schema(description = "请求时间戳", example = "1718712000")
    private Long timestamp;
}
