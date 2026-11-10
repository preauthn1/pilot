package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 管理员操作日志实体 - 对应 lms_admin_operation_log 表
 */
@Data
@TableName("lms_admin_operation_log")
public class AdminOperationLog {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 操作管理员ID */
    @TableField("admin_id")
    private Long adminId;

    /** 操作来源IP */
    private String ip;

    /** 请求URL */
    private String url;

    /** 请求参数 */
    private String params;

    /** 操作备注说明 */
    private String note;

    /** 联查 admin 表得到的管理员名称（非数据库字段） */
    @TableField(exist = false)
    private String adminName;

    /** 操作时间 */
    private LocalDateTime createdAt;
}
