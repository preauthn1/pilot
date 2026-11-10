package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 投注记录实体 - 对应 lms_coin_record 表
 */
@Data
@TableName("lms_coin_record")
public class CoinRecord {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户ID */
    @TableField("user_id")
    private Long userId;

    /** 渠道ID */
    @TableField("channel_id")
    private Long channelId;

    /** 投注金额（分） */
    private Long bet;

    /** 结算金额（分） */
    private Long amount;

    /** 投注类型 */
    @TableField("bet_type")
    private String betType;

    /** 完成时间 */
    @TableField("finish_time")
    private LocalDateTime finishTime;

    /** 扩展时间（秒） */
    @TableField("expand_time")
    private Long expandTime;

    /** 结算倍数 */
    @TableField("settlement_multiple")
    private Long settlementMultiple;

    /** 派彩金额（分） */
    @TableField("pay_out")
    private Long payOut;

    /** 游戏局号 */
    @TableField("round_id")
    private String roundId;

    /** 是否扩展：0-否，1-是 */
    private Integer expand;

    /** 标识标签 */
    private String tag;
}
