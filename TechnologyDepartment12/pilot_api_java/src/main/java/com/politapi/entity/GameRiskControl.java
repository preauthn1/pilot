package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 游戏风控配置实体 - 对应 game_risk_control 表
 */
@Data
@TableName("game_risk_control")
public class GameRiskControl {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("game_code")
    private String gameCode;

    private Integer rebate;

    private Long reserve;

    private Long progress;

    @JsonIgnore
    @TableField("progress_date")
    private LocalDate progressDate;

    @TableField("initial_bet")
    private Long initialBet;

    @TableField("amplitude")
    private Long amplitude;

    @TableField("btn_bet")
    private String btnBet;

    @TableField("bet_min")
    private Long betMin;

    @TableField("bet_max")
    private Long betMax;

    private Integer status;

    @TableField("deleted_at")
    private LocalDateTime deletedAt;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
