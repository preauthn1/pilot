package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 免费下注流水表 - 对应 ums_free_bet_log 表
 */
@Data
@TableName("ums_free_bet_log")
@JsonIgnoreProperties(ignoreUnknown = true)
public class UmsFreeBetLog {
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

    /** 操作类型: 1发放 2使用 3过期 4扣减(运营) */
    private Integer action;

    /** 本次变动次数(发放为正,使用为负) */
    private Integer count;

    /** 单次免费下注金额(分),发放时快照 */
    @JsonAlias("bet_amount")
    @TableField("bet_amount")
    private Long betAmount;

    /** 派彩金额(分),仅使用时填写 */
    private Long payout;

    /** 关联 lms_coin_record.round_id,仅使用时填写 */
    @JsonAlias("round_id")
    @TableField("round_id")
    private String roundId;

    /** 上游活动ID */
    @JsonAlias("activity_id")
    @TableField("activity_id")
    private String activityId;

    /** 上游发放幂等单号 */
    @JsonAlias("source_order_id")
    @TableField("source_order_id")
    private String sourceOrderId;

    /** 指定游戏代码，空字符串表示所有游戏可用 */
    @JsonAlias("game_code")
    @TableField("game_code")
    private String gameCode;

    /** 流水倍数快照。使用免费次数时从当时的免费次数记录复制 */
    @TableField("multiple")
    private Integer multiple;

    /** 过期时间(发放时设置,为空表示永不过期) */
    @JsonAlias("expire_at")
    @TableField("expire_at")
    private LocalDateTime expireAt;

    /** 状态: 0正常 1已过期 */
    private Integer status;

    /** 备注 */
    private String remark;

    /** 创建时间 */
    @JsonAlias("created_at")
    @TableField("created_at")
    private LocalDateTime createdAt;

    /** 更新时间 */
    @JsonAlias("updated_at")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
