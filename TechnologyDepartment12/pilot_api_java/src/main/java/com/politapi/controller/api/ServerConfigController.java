package com.politapi.controller.api;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.common.Result;
import com.politapi.dto.request.ChannelQueryRequest;
import com.politapi.entity.Channel;
import com.politapi.entity.ServerConfig;
import com.politapi.mapper.ChannelMapper;
import com.politapi.mapper.ServerConfigMapper;
import com.politapi.service.GameServerConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 对外开放 - 服务器配置
 */
@RestController("apiServerConfigController")
@RequestMapping("/api")
@Tag(name = "服务器配置", description = "游戏前端获取游戏服地址、WebSocket 连接信息")
public class ServerConfigController {

    @Autowired
    private ServerConfigMapper serverConfigMapper;
    @Autowired
    private ChannelMapper channelMapper;
    @Autowired
    private GameServerConfigService gameServerConfigService;

    public static final int NO_EXIST_CHANNEL = 201;

    /**
     * 获取服务器配置 + 生成 WebSocket token（飞机登录入口）
     */
    @PostMapping("/serverConfig")
    @Operation(summary = "获取服务器配置", description = "游戏前端登录时调用，返回服务器地址并生成 WebSocket token")
    public Result<?> serverConfig(@RequestBody Map<String, Object> params) {
        return gameServerConfigService.getServerConfig(params);
    }

    /**
     * 根据渠道获取服务器列表
     */
    @PostMapping("/server/getConfig")
    @Operation(summary = "按渠道获取服务器列表", description = "传入渠道名称获取该渠道的可用服务器列表（仅 status=1 的）")
    public Result<?> getServerList(@RequestBody ChannelQueryRequest req) {
        String channelName = req.getChannel();

        Long channelId = null;
        if (channelName != null && !channelName.isEmpty()) {
            Channel channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
            if (channel == null) {
                return Result.fail(NO_EXIST_CHANNEL, "渠道不存在");
            }
            channelId = channel.getId();
        }

        LambdaQueryWrapper<ServerConfig> qw = new LambdaQueryWrapper<>();
        qw.eq(ServerConfig::getStatus, 1);
        if (channelId != null) {
            qw.eq(ServerConfig::getChannel, channelId);
        }

        List<ServerConfig> configs = serverConfigMapper.selectList(qw);
        return Result.ok(configs);
    }
}
