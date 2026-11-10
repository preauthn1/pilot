package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * IP 白名单实体 - 对应 ams_ip_list 表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("ams_ip_list")
public class IpList extends BaseTimestampEntity {

    /** IP地址 */
    private String ip;

    /** 管理后台状态：0-禁用，1-启用 */
    @TableField("admin_status")
    private Integer adminStatus;

    /** API接口状态：0-禁用，1-启用 */
    @TableField("api_status")
    private Integer apiStatus;

    /** 备注说明 */
    private String remarks;

    /** 管理员名称 */
    @TableField("admin_name")
    private String adminName;
}
