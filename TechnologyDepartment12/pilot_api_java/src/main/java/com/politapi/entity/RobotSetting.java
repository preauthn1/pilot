package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * 机器人配置实体 - 对应 cms_robot_setting 表
 */
@Data
@TableName("cms_robot_setting")
@JsonIgnoreProperties(ignoreUnknown = true)
public class RobotSetting {
    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 投注范围（JSON格式） */
    @JsonAlias("bet_range")
    @TableField("bet_range")
    private String betRange;

    /** 倍数范围（JSON格式） */
    @JsonAlias("multiple_range")
    @TableField("multiple_range")
    private String multipleRange;

    /** 投注概率（百分比） */
    @JsonAlias("betting_odds")
    @TableField("betting_odds")
    private Integer bettingOdds;

    /** 机器人数量（数字=固定；逗号分隔=随机范围，如5,30） */
    @JsonAlias("robot_number")
    @TableField("robot_number")
    private String robotNumber;

    /** 机器人开关 0=关闭 1=开启 */
    @JsonAlias("robot_enabled")
    @TableField("robot_enabled")
    private Integer robotEnabled;

    /** 系统级配置ID */
    @TableField("`system`")
    private Long system;

    /** 游戏编码 */
    @JsonAlias("game_code")
    @TableField("game_code")
    private String gameCode;

    /** 渠道ID */
    private Long channel;
}
