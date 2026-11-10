package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

/**
 * 渠道报表实体 - 对应 ams_channel_report 表
 */
@Data
@TableName("ams_channel_report")
public class ChannelReport {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 商户ID */
    @TableField("merchant_id")
    private Long merchantId;

    /** 渠道ID */
    @TableField("channel_id")
    private Long channelId;

    /** 投注笔数 */
    @TableField("bets_number")
    private Long betsNumber;

    /** 投注总额（分） */
    private Long bets;

    /** 派彩总额（分） */
    private Long payout;

    /** 玩家输赢（分） */
    @TableField("player_wl")
    private Long playerWl;

    /** 平台输赢（分） */
    @TableField("platform_wl")
    private Long platformWl;

    /** 标识标签 */
    private String tag;

    @TableField("game_code")
    private String gameCode;

    /** 创建时间 */
    private String createdAt;

    /** 更新时间 */
    @TableField("updated_at")
    private String updatedAt;
}
