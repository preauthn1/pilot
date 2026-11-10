package com.politapi.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 转账订单查询请求 DTO
 */
@Data
@Schema(description = "转账订单查询请求（查询上分/下分订单状态）")
public class TransferOrderQueryRequest {

    @Schema(description = "渠道名称", example = "channel_tiktok", requiredMode = Schema.RequiredMode.REQUIRED)
    private String channel;

    @Schema(description = "商户订单号", example = "TX_20240618_001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String orderId;
}
