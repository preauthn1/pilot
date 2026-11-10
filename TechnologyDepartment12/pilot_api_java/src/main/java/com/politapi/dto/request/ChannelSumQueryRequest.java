package com.politapi.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 渠道汇总查询请求 DTO
 */
@Data
@Schema(description = "渠道定时汇总记录查询请求")
public class ChannelSumQueryRequest {

    @Schema(description = "渠道名称", example = "channel_tiktok", requiredMode = Schema.RequiredMode.REQUIRED)
    private String channel;

    @Schema(description = "起始时间戳（秒）", example = "1718640000")
    private Long start;

    @Schema(description = "结束时间戳（秒）", example = "1718726400")
    private Long end;
}
