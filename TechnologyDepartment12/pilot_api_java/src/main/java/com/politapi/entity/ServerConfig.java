package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

/**
 * 服务器配置实体 - 对应 cms_server_config 表
 */
@Data
@TableName("cms_server_config")
public class ServerConfig {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 渠道ID */
    private Long channel;

    /** 通信协议（如 http/https/ws） */
    private String protocol;

    /** 服务器地址 */
    private String address;

    /** 状态：0-禁用，1-启用 */
    private Integer status;

    /** 服务器密钥 */
    private String secret;
}
