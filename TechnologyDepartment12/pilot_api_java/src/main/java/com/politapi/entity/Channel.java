package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 渠道实体 - 对应 mms_channel 表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("mms_channel")
public class Channel extends BaseTimestampEntity {

    /** 渠道名称 */
    private String name;

    /** 关联商户ID */
    @TableField("merchant_id")
    private Long merchantId;

    /** 回调通知地址 */
    @TableField("notify_url")
    private String notifyUrl;

    /** 下线/离线地址 */
    @TableField("offline_url")
    private String offlineUrl;

    /** 渠道域名 */
    private String domain;

    /** 游戏代码 */
    @TableField("game_code")
    private String gameCode;

    /** 用户赢金模式 */
    @TableField("user_win_money")
    private Integer userWinMoney;

    /** 玩家ID前缀 */
    @TableField("player_prefix")
    private String playerPrefix;

    /** 渠道密钥（非数据库字段） */
    @TableField(exist = false)
    private String secret;

    /** 渠道余额/额度（分） */
    private Long amount;
}
