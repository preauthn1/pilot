package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 角色实体 - 对应 ams_role 表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("ams_role")
public class Role extends BaseTimestampEntity {

    /** 角色名称 */
    private String name;

    /** 守卫名称（如 admin） */
    private String guardName;

    /** 权限ID列表（逗号分隔） */
    @TableField("permission_ids")
    private String permissionIds;

    /** 数据范围：0=受限（按管理员 package_ids 过滤）, 1=全部数据 */
    @TableField("data_scope")
    private Integer dataScope;
}
