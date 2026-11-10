package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

/**
 * 日报表实体 - 对应 ams_daily_report 表
 */
@Data
@TableName("ams_daily_report")
public class DailyReport {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

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

    /** 报表日期 */
    private String date;

    /** 标识标签 */
    private String tag;

    /** 创建时间 */
    private String createdAt;

    /** 更新时间 */
    @TableField("updated_at")
    private String updatedAt;
}
