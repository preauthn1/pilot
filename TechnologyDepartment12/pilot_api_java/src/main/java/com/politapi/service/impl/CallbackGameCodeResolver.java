package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.entity.Channel;
import com.politapi.entity.ChannelGameConfig;
import com.politapi.mapper.ChannelGameConfigMapper;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class CallbackGameCodeResolver {

    private final ChannelGameConfigMapper channelGameConfigMapper;

    public CallbackGameCodeResolver(ChannelGameConfigMapper channelGameConfigMapper) {
        this.channelGameConfigMapper = channelGameConfigMapper;
    }

    public String resolve(Channel channel, String requestedGameCode) {
        if (requestedGameCode == null) {
            return channel.getGameCode();
        }

        if (requestedGameCode.isBlank()) {
            throw new IllegalArgumentException("gameCode is invalid");
        }

        String normalizedGameCode = requestedGameCode.trim().toLowerCase(Locale.ROOT);
        Long mappingCount = channelGameConfigMapper.selectCount(
                new LambdaQueryWrapper<ChannelGameConfig>()
                        .eq(ChannelGameConfig::getChannelId, channel.getId())
                        .eq(ChannelGameConfig::getGameCode, normalizedGameCode)
                        .eq(ChannelGameConfig::getStatus, 1));
        if (mappingCount == null || mappingCount == 0) {
            throw new IllegalArgumentException("Invalid gameCode for channel");
        }
        return normalizedGameCode;
    }
}
