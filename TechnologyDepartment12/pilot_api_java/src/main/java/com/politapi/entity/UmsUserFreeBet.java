package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户免费次数表 - 对应 ums_user_free_bet 表
 */
@Data
@TableName("ums_user_free_bet")
@JsonIgnoreProperties(ignoreUnknown = true)
public class UmsUserFreeBet {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户ID */
    @JsonAlias("user_id")
    @TableField("user_id")
    private Long userId;

    /** 渠道ID */
    @JsonAlias("channel_id")
    @TableField("channel_id")
    private Long channelId;

    /** 剩余免费次数 */
    @JsonAlias("remain_count")
    @TableField("remain_count")
    private Integer remainCount;

    /** 累计发放次数 */
    @JsonAlias("total_granted")
    @TableField("total_granted")
    private Integer totalGranted;

    /** 累计使用次数 */
    @JsonAlias("total_used")
    @TableField("total_used")
    private Integer totalUsed;

    /** 流水倍数，由上游发放免费次数时传入 */
    @TableField("multiple")
    private Integer multiple;

    /** 指定游戏代码，空字符串表示所有游戏可用 */
    @JsonAlias("game_code")
    @TableField("game_code")
    private String gameCode;

    /** 更新时间 */
    @JsonAlias("updated_at")
    @TableField("updated_at")
    private LocalDateTime updatedAt;

    /** 创建时间 */
    @JsonAlias("created_at")
    @TableField("created_at")
    private LocalDateTime createdAt;
}
