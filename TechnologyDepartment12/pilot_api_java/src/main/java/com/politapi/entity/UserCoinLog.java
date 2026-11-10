package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户金币日志实体 - 对应 ums_user_coin_log 表
 */
@Data
@TableName("ums_user_coin_log")
public class UserCoinLog {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户ID */
    private Long userId;

    /** 操作类型（transfer_in：转入，transfer_out：转出） */
    private String type;

    /** 金币数量（分） */
    private Long coin;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 转入类型常量 */
    public static final String TRANSFER_IN = "transfer_in";

    /** 转出类型常量 */
    public static final String TRANSFER_OUT = "transfer_out";
}
