package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

/**
 * 用户钱包/金币实体 - 对应 ums_coin 表
 */
@Data
@TableName("ums_coin")
public class Coin {
    /** 主键为用户ID，无独立 id 列 */
    @TableId(value = "user_id", type = IdType.INPUT)
    private Long userId;

    /** 金币余额（分） */
    private Long coin;

    /** 是否锁定：0-未锁定，1-已锁定 */
    @TableField("is_lock")
    private Integer isLock;
}
