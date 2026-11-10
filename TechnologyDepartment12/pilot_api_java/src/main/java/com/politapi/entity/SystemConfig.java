package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 系统配置实体 - 对应 cms_system_config 表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("cms_system_config")
public class SystemConfig extends BaseEntity {

    /** 配置键（DB 列名 key） */
    @TableField("`key`")
    @JsonProperty("key")
    private String cfgKey;

    /** 配置值（DB 列名 value） */
    @TableField("`value`")
    @JsonProperty("value")
    private String cfgValue;

    /** 备注说明 */
    private String remark;
}
