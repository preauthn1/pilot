package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 币种设置实体 - 对应 cms_currency_setting 表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("cms_currency_setting")
public class CurrencySetting extends BaseTimestampEntity {

    /** 所属渠道ID */
    @TableField("channel_id")
    private Long channelId;

    /** 币种代码/名称 */
    private String currency;

    /** 标识标签 */
    private String tag;
}
