package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.politapi.entity.Channel;
import com.politapi.entity.ServerConfig;
import com.politapi.mapper.ChannelMapper;
import com.politapi.mapper.ServerConfigMapper;
import com.politapi.service.ServerConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 服务器配置服务实现
 */
@Service
public class ServerConfigServiceImpl implements ServerConfigService {

    @Autowired private ServerConfigMapper serverConfigMapper;
    @Autowired private ChannelMapper channelMapper;

    @Override
    public Map<String, Object> getServerConfigList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);

        LambdaQueryWrapper<ServerConfig> qw = new LambdaQueryWrapper<>();
        Object channel = params.get("channel");
        if (channel != null && !channel.toString().isEmpty()) {
            qw.eq(ServerConfig::getChannel, Long.parseLong(channel.toString()));
        }
        Object merchantId = params.get("merchant_id");
        if (merchantId != null && !merchantId.toString().isEmpty()) {
            List<Channel> channels = channelMapper.selectList(
                    new LambdaQueryWrapper<Channel>().eq(Channel::getMerchantId, Long.parseLong(merchantId.toString())));
            List<Long> channelIds = channels.stream().map(Channel::getId).toList();
            if (!channelIds.isEmpty()) {
                qw.in(ServerConfig::getChannel, channelIds);
            }
            else return Map.of("list", Collections.emptyList(), "total", 0L);
        }
        qw.orderByDesc(ServerConfig::getId);
        IPage<ServerConfig> pg = serverConfigMapper.selectPage(Page.of(page, limit), qw);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public Long create(Map<String, String> params) {
        ServerConfig sc = new ServerConfig();
        sc.setChannel(Long.parseLong(params.get("channel")));
        sc.setProtocol(params.getOrDefault("protocol", "https"));
        sc.setAddress(params.get("address"));
        sc.setStatus(Integer.parseInt(params.getOrDefault("status", "1")));
        sc.setSecret(params.get("secret"));
        serverConfigMapper.insert(sc);
        return sc.getId();
    }

    @Override
    public void update(Map<String, String> params) {
        ServerConfig sc = new ServerConfig();
        sc.setId(Long.parseLong(params.get("id")));
        if (params.containsKey("channel")) {
            sc.setChannel(Long.parseLong(params.get("channel")));
        }
        if (params.containsKey("protocol")) {
            sc.setProtocol(params.get("protocol"));
        }
        if (params.containsKey("address")) {
            sc.setAddress(params.get("address"));
        }
        if (params.containsKey("status")) {
            sc.setStatus(Integer.parseInt(params.get("status")));
        }
        if (params.containsKey("secret")) {
            sc.setSecret(params.get("secret"));
        }
        serverConfigMapper.updateById(sc);
    }

    private long toLong(Object val, long defaultVal) {
        if (val == null) {
            return defaultVal;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        try { return Long.parseLong(val.toString()); } catch (Exception e) { return defaultVal; }
    }
}
