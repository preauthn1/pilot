package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 站内通知实体 - 对应 ums_notification 表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("ums_notification")
public class Notification extends BaseTimestampEntity {

    /** 管理员ID */
    @TableField("admin_id")
    private Long adminId;

    /** 通知标题 */
    private String title;

    /** 通知内容 */
    private String message;

    /** 头像URL */
    private String avatar;

    /** 跳转链接 */
    private String link;

    /** 是否已读 */
    @TableField("is_read")
    private Integer isRead;
}
