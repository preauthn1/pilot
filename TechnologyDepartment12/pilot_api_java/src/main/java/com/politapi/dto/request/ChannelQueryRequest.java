package com.politapi.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 按渠道查询的通用请求 DTO
 */
@Data
@Schema(description = "按渠道查询请求（传入渠道名称，为空则返回全部）")
public class ChannelQueryRequest {

    @Schema(description = "渠道名称（为空返回全部）", example = "channel_tiktok")
    private String channel;
}
