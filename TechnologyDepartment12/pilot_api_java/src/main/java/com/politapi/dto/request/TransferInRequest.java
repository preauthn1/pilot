package com.politapi.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 上分（转入）请求 DTO
 */
@Data
@Schema(description = "上分/转入请求（从渠道余额转入用户余额）")
public class TransferInRequest {

    @Schema(description = "用户名", example = "player001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @Schema(description = "渠道名称", example = "channel_tiktok", requiredMode = Schema.RequiredMode.REQUIRED)
    private String channel;

    @Schema(description = "金额（分），必须 > 0", example = "50000", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long money;

    @Schema(description = "商户订单号（幂等键，重复提交返回 code=105）", example = "TX_20240618_001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String orderId;

    @Schema(description = "币种", example = "INR")
    private String currency;

    @Schema(description = "请求签名")
    private String sign;

    @Schema(description = "请求时间戳（秒）", example = "1718712000")
    private Long timestamp;
}
