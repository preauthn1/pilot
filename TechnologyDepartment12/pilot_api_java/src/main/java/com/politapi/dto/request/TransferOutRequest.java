package com.politapi.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 下分（转出）请求 DTO
 */
@Data
@Schema(description = "下分/转出请求（从用户余额转回渠道余额）")
public class TransferOutRequest {

    @Schema(description = "用户名", example = "player001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @Schema(description = "渠道名称", example = "channel_tiktok", requiredMode = Schema.RequiredMode.REQUIRED)
    private String channel;

    @Schema(description = "金额（分）", example = "30000", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long money;

    @Schema(description = "商户订单号（幂等键）", example = "TX_20240618_002", requiredMode = Schema.RequiredMode.REQUIRED)
    private String orderId;

    @Schema(description = "是否全额转出：1=全额（忽略 money 字段）", example = "0")
    private Integer isFull;

    @Schema(description = "币种", example = "INR")
    private String currency;

    @Schema(description = "请求签名")
    private String sign;

    @Schema(description = "请求时间戳（秒）", example = "1718712000")
    private Long timestamp;
}
