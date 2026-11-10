package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 任务资金记录实体 - 对应 ums_task_capital 表
 */
@Data
@TableName("ums_task_capital")
public class TaskCapital {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户名 */
    private String username;

    /** 关联ID */
    @TableField("ref_id")
    private String refId;

    /** 变动金额 */
    private Double money;

    /** 标识标签 */
    private String tag;

    /** 变动前金币余额（分） */
    @TableField("before_coin")
    private Long beforeCoin;

    /** 变动后金币余额（分） */
    @TableField("after_coin")
    private Long afterCoin;

    /** 备注说明（MySQL 保留字，映射到 explain 列） */
    @TableField("`explain`")
    private String remark;

    /** 变动类型 */
    private Integer type;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}
