package com.politapi.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 任务查询请求 DTO（我的任务、任务资金记录）
 */
@Data
@Schema(description = "任务查询请求（查询我的任务或资金记录）")
public class TaskQueryRequest {

    @Schema(description = "用户名", example = "player001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @Schema(description = "渠道名称", example = "channel_tiktok")
    private String channel;
}
