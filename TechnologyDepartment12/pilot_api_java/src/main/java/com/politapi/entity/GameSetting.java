package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * 游戏设置实体 - 对应 cms_game_setting 表
 */
@Data
@TableName("cms_game_setting")
@JsonIgnoreProperties(ignoreUnknown = true)
public class GameSetting {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 初始投注额（分） */
    @JsonAlias("initial_bet")
    @TableField("initial_bet")
    private Long initialBet;

    /** 按钮投注额配置（JSON格式） */
    @JsonAlias("btn_bet")
    @TableField("btn_bet")
    private String btnBet;

    /** 振幅（波动范围） */
    private Long amplitude;

    /** 最小投注额（分） */
    @JsonAlias("bet_min")
    @TableField("bet_min")
    private Long betMin;

    /** 最大投注额（分） */
    @JsonAlias("bet_max")
    @TableField("bet_max")
    private Long betMax;

    /** 最小结算倍数 */
    @JsonAlias("settlement_min")
    @TableField("settlement_min")
    private Double settlementMin;

    /** 最大结算倍数 */
    @JsonAlias("settlement_max")
    @TableField("settlement_max")
    private Double settlementMax;

    /** 游戏最大结算倍数 */
    @JsonAlias("game_max")
    private Double gameMax;

    /** 游戏状态 */
    @JsonAlias("game_status")
    private Integer gameStatus;

    /** 是否开启免费下注 */
    @JsonAlias("free_bet_enabled")
    @TableField("free_bet_enabled")
    private Integer freeBetEnabled;

    /** 单次免费下注金额(分) */
    @JsonAlias("free_bet_amount")
    @TableField("free_bet_amount")
    private Long freeBetAmount;

    /** 渠道ID */
    private Long channel;

    /** 规则内容（HTML/Markdown） */
    @JsonAlias("rule_content")
    @TableField("rule_content")
    private String ruleContent;

    /** 系统级配置ID */
    @TableField("`system`")
    private Long system;
}
