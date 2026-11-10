package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.politapi.common.BasePageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;

/**
 * 游戏结算记录实体 - 对应 lms_game_record 表
 * <p>
 * 直接作为查询请求体：Jackson 自动将 camelCase JSON 反序列化到字段。
 * transient 字段（@TableField(exist = false)）仅用于传参，不写入 SQL。
 * </p>
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("lms_game_record")
@JsonIgnoreProperties(ignoreUnknown = true)
public class GameRecord extends BasePageQuery {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 游戏局号（查询条件 & 数据库列） */
    @TableField("round_id")
    private String roundId;

    /** 渠道ID */
    @TableField("channel_id")
    private Long channelId;

    @TableField("game_code")
    private String gameCode;

    /** 结算金额（正为赢，负为输） */
    private Integer settlement;

    /** 游戏结果 */
    private String result;

    /** 杀率(1~99)，1 表示不杀，0 表示历史数据或无 */
    private Integer rebate;

    /** 结算类型：0=系统自动，1=系统手动（查询条件 & 数据库列）。String 类型避免空字符串反序列化报错 */
    @TableField("billing_type")
    private String billingType;

    /** 操作员 */
    private String operator;

    /** 标识标签（币种） */
    private String tag;

    /** 创建时间 */
    private LocalDateTime createdAt;

    // ---- 查询用 transient 字段 ----

    /** 查询开始时间，前端传格式化字符串 */
    @TableField(exist = false)
    private String startAt;

    /** 查询结束时间，前端传格式化字符串 */
    @TableField(exist = false)
    private String endAt;
}
