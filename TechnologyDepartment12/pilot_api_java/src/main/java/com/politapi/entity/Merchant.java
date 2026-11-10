package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 商户实体 - 对应 mms_merchant 表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("mms_merchant")
public class Merchant extends BaseTimestampEntity {

    /** 商户用户名 */
    private String username;

    /** 商户密钥 */
    private String secret;

    /** 钱包类型：1-共享钱包，2-转账钱包 */
    @TableField("wallet_type")
    private Integer walletType;

    /** 跳转URL */
    @TableField("skip_url")
    private String skipUrl;

    /** 商户返回地址 */
    @TableField("return_url")
    private String returnUrl;

    /** 赢金比例（百分比） */
    @TableField("win_proportion")
    private Integer winProportion;

    /** 赢金限额（分） */
    @TableField("win_limit")
    private Long winLimit;
}
