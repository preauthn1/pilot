package com.politapi.service;

import com.politapi.entity.ChannelGameConfig;

import java.util.Map;

/**
 * 游戏控制服交互接口
 */
public interface GameControlService {

    /** 按指定渠道游戏映射精确重载游戏控制配置。 */
    void reloadControlConfig(ChannelGameConfig channelGameConfig);

    void reloadGameRiskControl(String gameCode);

    /** 实时结算（调用游戏控制服强制结算） */
    Map<String, Object> realTimeSettlement(Map<String, Object> params, Long adminId);
}
