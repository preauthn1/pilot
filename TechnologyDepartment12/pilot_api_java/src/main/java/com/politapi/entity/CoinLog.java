package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 金币变动日志实体 - 对应 lms_coin_log 表
 */
@Data
@TableName("lms_coin_log")
public class CoinLog {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单号 */
    @TableField("order_id")
    private String orderId;

    /** 渠道订单号 */
    @TableField("channel_order_id")
    private String channelOrderId;

    /** 用户ID */
    @TableField("user_id")
    private Long userId;

    /** 渠道ID */
    @TableField("channel_id")
    private Long channelId;

    /** 金币变动数量（分，正数为增加，负数为减少） */
    private Long coin;

    /** 变动类型 */
    private Integer type;

    /** 币种 */
    private String currency;

    /** 创建时间 */
    private LocalDateTime createdAt;
}
