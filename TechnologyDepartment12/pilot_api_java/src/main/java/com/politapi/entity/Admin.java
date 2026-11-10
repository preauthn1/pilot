package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;

/**
 * 管理员实体 - 对应 ams_admin 表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("ams_admin")
public class Admin extends BaseTimestampEntity {

    /** 管理员名称 */
    private String name;

    /** 邮箱（非数据库字段，仅用于接收/展示） */
    @TableField(exist = false)
    private String email;

    /** 登录密码 */
    private String password;

    /** 操作密码（二次验证用） */
    @TableField("opt_pwd")
    private String optPwd;

    /** 角色ID */
    @TableField("role_id")
    private Integer roleId;

    /** 状态：0-禁用，1-启用 */
    private Integer status;

    /** Google 验证器密钥 */
    @TableField("google_encrypt")
    private String googleEncrypt;

    /** 管理员类型 */
    @TableField("admin_type")
    private Integer adminType;

    /** 关联商户ID（空表示全部） */
    @TableField("merchant_id")
    private String merchantId;

    /** 关联渠道ID（空表示全部） */
    @TableField("channel_id")
    private String channelId;

    /** 是否启用包：0-否，1-是 */
    @TableField("is_package")
    private Integer isPackage;

    /** 包ID列表（JSON数组） */
    @TableField("package_ids")
    private String packageIds = "";

    /** 平台ID */
    @TableField("platform_id")
    private String platformId;

    /** Remember Token（非数据库字段） */
    @TableField(exist = false)
    private String rememberToken;

    /** 邮箱验证时间（非数据库字段） */
    @TableField(exist = false)
    private LocalDateTime emailVerifiedAt;
}
