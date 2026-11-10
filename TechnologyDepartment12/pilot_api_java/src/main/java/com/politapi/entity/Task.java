package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 任务实体 - 对应 ums_task 表
 */
@Data
@TableName("ums_task")
public class Task {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 任务标题 */
    private String title;

    /** 任务状态：0-禁用，1-启用 */
    private Integer state;

    /** 系统级配置ID */
    @TableField("`system`")
    private Long system;

    /** 渠道ID */
    private Long channel;

    /** 任务内容 */
    private String content;

    /** 任务要求 */
    private String requirement;

    /** 可领取次数 */
    private Integer num;

    /** 奖励金额 */
    private Double money;

    /** 任务素材（图片URL等） */
    private String material;

    /** 备注说明 */
    private String remarks;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}
