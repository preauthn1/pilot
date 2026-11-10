package com.politapi.service.impl;

import cn.hutool.crypto.SecureUtil;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.RobotSetting;
import com.politapi.mapper.RobotSettingMapper;
import com.politapi.service.RobotSettingService;
import com.politapi.util.HttpUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 机器人配置服务实现
 */
@Slf4j
@Service
public class RobotSettingServiceImpl extends ServiceImpl<RobotSettingMapper, RobotSetting> implements RobotSettingService {

    @Value("${game.control.url:http://127.0.0.1:9000}")
    private String controlServerUrl;

    @Value("${game.control.key:5dfa8c73449f6299}")
    private String controlServerKey;

    @Override
    public Map<String, Object> getRobotList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);
        IPage<RobotSetting> pg = baseMapper.selectPage(Page.of(page, limit),
                new LambdaQueryWrapper<RobotSetting>().orderByDesc(RobotSetting::getId));
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("list", pg.getRecords());
        r.put("total", pg.getTotal());
        return r;
    }

    @Override
    public Long add(RobotSetting robotSetting) {
        baseMapper.insert(robotSetting);
        notifyRobotConfig(robotSetting);
        return robotSetting.getId();
    }

    @Override
    public void update(RobotSetting robotSetting) {
        baseMapper.updateById(robotSetting);
        notifyRobotConfig(robotSetting);
    }

    /**
     * 通知 game-server 重新加载机器人配置
     *
     * @param robotSetting 变更后的机器人配置（用于获取 channel）
     */
    private void notifyRobotConfig(RobotSetting robotSetting) {
        try {
            String timestamp = String.valueOf(System.currentTimeMillis());
            String signStr = "timestamp=" + timestamp + "&key=" + controlServerKey;
            String sign = SecureUtil.md5(signStr);

            Map<String, Object> postData = new LinkedHashMap<>();
            postData.put("tag", 1); // Aviator（小飞机）
            postData.put("channel", robotSetting.getChannel() != null
                    ? String.valueOf(robotSetting.getChannel()) : "");
            postData.put("gameCode", robotSetting.getGameCode());
            postData.put("timestamp", timestamp);
            postData.put("sign", sign);

            JSONObject ret = HttpUtil.postJson(controlServerUrl + "/robot/config", postData);
            int code = ret.getIntValue("code");
            if (code != 0) {
                log.warn("通知 game-server 重载机器人配置失败: code={}, msg={}", code, ret.getString("msg"));
            } else {
                log.info("已通知 game-server 重载机器人配置, channel={}", robotSetting.getChannel());
            }
        } catch (Exception e) {
            log.warn("通知 game-server 重载机器人配置异常: {}", e.getMessage());
        }
    }

    private long toLong(Object v, long d) {
        if (v == null) {
            return d;
        }
        if (v instanceof Number) {
            return ((Number) v).longValue();
        }
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return d; }
    }
}
