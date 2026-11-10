package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 任务领取记录实体 - 对应 ums_task_user 表
 */
@Data
@TableName("ums_task_user")
public class TaskUser {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 任务ID */
    @TableField("task_id")
    private Long taskId;

    /** 领取用户名 */
    private String username;

    /** 渠道ID */
    private Long channel;

    /** 提交内容 */
    private String content;

    /** 提交图片URL */
    private String img;

    /** 奖励金额 */
    private Double money;

    /** 审核状态：0-待审核，1-已通过，2-已拒绝 */
    private Integer state;

    /** 关联ID */
    @TableField("ref_id")
    private String refId;

    /** 审核备注 */
    private String remarks;

    /** 币种（非数据库字段） */
    @TableField(exist = false)
    private String currency;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}
