package com.politapi.service;

import com.politapi.entity.RobotSetting;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * 机器人配置服务接口
 */
public interface RobotSettingService extends IService<RobotSetting> {
    Map<String, Object> getRobotList(Map<String, Object> params);
    Long add(RobotSetting robotSetting);
    void update(RobotSetting robotSetting);
}
