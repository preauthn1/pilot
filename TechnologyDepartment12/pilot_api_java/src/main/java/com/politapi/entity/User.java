package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户实体 - 对应 ums_user 表
 */
@Data
@TableName("ums_user")
public class User {

    /** 用户主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 渠道ID，关联渠道表 */
    @TableField("channel_id")
    private Long channelId;

    /** 用户名 */
    private String username;

    /** 用户状态：0-禁用，1-启用 */
    private Integer status;

    /** 在线状态：0-离线，1-在线 */
    private Integer online;

    /** 商户ID */
    @TableField("merchant_id")
    private String merchantId;

    /** 扩展字段（JSON格式，存储自定义属性） */
    private String expand;

    /** 用户当前币种 */
    private String currency;

    /** 累计赢金（分） */
    @TableField("win_money")
    private Long winMoney;

    /** 当日赢金统计日期 */
    @TableField("win_money_day")
    private LocalDateTime winMoneyDay;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}
