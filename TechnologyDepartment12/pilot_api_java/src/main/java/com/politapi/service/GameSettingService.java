package com.politapi.service;

import com.politapi.entity.GameSetting;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * 游戏设置服务接口
 */
public interface GameSettingService extends IService<GameSetting> {

    /** 分页查询游戏设置列表 */
    Map<String, Object> getGameList(Map<String, Object> params);

    /** 新增游戏设置 */
    Long add(GameSetting gameSetting);

    /** 更新游戏设置 */
    void update(GameSetting gameSetting);
}
