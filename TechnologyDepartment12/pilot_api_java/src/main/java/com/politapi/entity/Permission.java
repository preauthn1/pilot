package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 权限/菜单实体 - 对应 ams_permission 表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("ams_permission")
public class Permission extends BaseTimestampEntity {

    /** 父级ID（DB 列名 pid） */
    @TableField("pid")
    private Long parentId;

    /** 权限标识名称（如 admin.manage） */
    private String name;

    /** 守卫名称（如 admin） */
    private String guardName;

    /** 显示名称（DB 列名 title） */
    @TableField("title")
    private String displayName;

    /** 菜单图标 */
    private String icon;

    /** 前端路由路径（DB 列名 path） */
    @TableField("path")
    private String route;

    /** 前端组件路径 */
    private String component;

    /** 排序号 */
    private Integer sort;

    /** 是否隐藏：0-显示，1-隐藏 */
    private Integer hidden;

    /** 前端文件名 */
    @TableField("file_name")
    private String fileName;

    /** 是否不缓存：0-缓存，1-不缓存 */
    @TableField("no_keep_alive")
    private Integer noKeepAlive;
}
