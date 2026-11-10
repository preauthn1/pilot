package com.politapi.controller.api;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.common.Result;
import com.politapi.dto.request.ChannelQueryRequest;
import com.politapi.entity.Channel;
import com.politapi.entity.RobotSetting;
import com.politapi.mapper.ChannelMapper;
import com.politapi.mapper.RobotSettingMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 对外开放 - 机器人设置
 */
@RestController("apiRobotSettingController")
@Tag(name = "机器人设置", description = "游戏前端获取机器人行为参数配置")
public class RobotSettingController {

    @Autowired private RobotSettingMapper robotSettingMapper;
    @Autowired private ChannelMapper channelMapper;

    public static final int NO_EXIST_CHANNEL = 201;

    /**
     * 根据渠道获取机器人设置列表
     */
    @PostMapping("/robot/getSetting")
    @Operation(summary = "获取机器人设置", description = "传入渠道名称获取该渠道的机器人配置，不传则返回全部")
    public Result<?> getRobotSetting(@RequestBody ChannelQueryRequest req) {
        String channelName = req.getChannel();

        Long channelId = null;
        if (channelName != null && !channelName.isEmpty()) {
            Channel channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
            if (channel == null) {
                return Result.fail(NO_EXIST_CHANNEL, "渠道不存在");
            }
            channelId = channel.getId();
        }

        List<RobotSetting> settings;
        if (channelId != null) {
            settings = robotSettingMapper.selectList(
                    new LambdaQueryWrapper<RobotSetting>().eq(RobotSetting::getChannel, channelId));
        } else {
            settings = robotSettingMapper.selectList(null);
        }

        return Result.ok(settings);
    }
}
