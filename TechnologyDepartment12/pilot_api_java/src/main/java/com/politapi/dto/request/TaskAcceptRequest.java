package com.politapi.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 领取任务请求 DTO
 */
@Data
@Schema(description = "领取任务请求")
public class TaskAcceptRequest {

    @JsonProperty("task_id")
    @Schema(description = "任务ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long taskId;

    @Schema(description = "用户名", example = "player001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @Schema(description = "渠道ID", example = "5")
    private Long channel;
}
