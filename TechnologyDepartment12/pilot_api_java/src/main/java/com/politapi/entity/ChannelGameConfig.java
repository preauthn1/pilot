package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 渠道游戏映射配置实体 - 对应 channel_game_config 表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("channel_game_config")
public class ChannelGameConfig extends BaseTimestampEntity {

    @TableField("channel_id")
    private Long channelId;

    @TableField("game_code")
    private String gameCode;

    private String domain;

    private Integer status;

    @TableField("server_config_id")
    private Long serverConfigId;

    @TableField("game_setting_id")
    private Long gameSettingId;

    private Integer rebate;

    private Long reserve;

    private Long progress;
}
