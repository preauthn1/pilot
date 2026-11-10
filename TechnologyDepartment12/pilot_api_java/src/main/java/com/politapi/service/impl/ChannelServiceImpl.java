package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.Channel;
import com.politapi.mapper.ChannelMapper;
import com.politapi.service.ChannelService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 渠道服务实现
 */
@Service
public class ChannelServiceImpl extends ServiceImpl<ChannelMapper, Channel> implements ChannelService {

    @Override
    @Cacheable(value = "channel", key = "#id", unless = "#result == null")
    public Channel getByIdWithMerchant(Long id) {
        return baseMapper.selectById(id);
    }

    @Override
    @Cacheable(value = "channelByName", key = "#name", unless = "#result == null")
    public Channel getByName(String name) {
        return baseMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, name));
    }

    @Override
    public Object getChannelBy(Map<String, Object> params) {
        Object merchantId = params.get("merchant_id");
        LambdaQueryWrapper<Channel> qw = new LambdaQueryWrapper<>();
        if (merchantId != null && !merchantId.toString().isEmpty()) {
            qw.eq(Channel::getMerchantId, Long.parseLong(merchantId.toString()));
        }
        return baseMapper.selectList(qw);
    }

    @Override
    public Map<String, Object> getChannelList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);

        LambdaQueryWrapper<Channel> qw = new LambdaQueryWrapper<>();
        Object merchantId = params.get("merchant_id");
        if (merchantId != null) {
            qw.eq(Channel::getMerchantId, toLong(merchantId, 0));
        }
        qw.orderByDesc(Channel::getId);
        IPage<Channel> pg = baseMapper.selectPage(Page.of(page, limit), qw);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public Long create(Map<String, String> params) {
        String name = params.get("name");
        String playerPrefix = params.get("playerPrefix");
        if (playerPrefix == null) {
            playerPrefix = params.get("player_prefix");
        }
        if (name == null || playerPrefix == null) {
            throw new IllegalArgumentException("参数不完整");
        }

        Channel exist = baseMapper.selectOne(new LambdaQueryWrapper<Channel>()
                .eq(Channel::getName, name).or().eq(Channel::getPlayerPrefix, playerPrefix));
        if (exist != null) {
            throw new IllegalArgumentException("渠道名称或前缀已存在");
        }

        Channel c = new Channel();
        c.setName(name);
        c.setPlayerPrefix(playerPrefix);
        c.setMerchantId(Long.parseLong(params.getOrDefault("merchantId", "0")));
        c.setNotifyUrl(params.getOrDefault("notifyUrl", ""));
        c.setOfflineUrl(params.getOrDefault("offlineUrl", ""));
        c.setDomain(params.getOrDefault("domain", ""));
        c.setGameCode(params.getOrDefault("gameCode", ""));
        if (params.containsKey("amount")) {
            c.setAmount(Long.parseLong(params.get("amount")));
        }
        baseMapper.insert(c);
        return c.getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "channel", key = "#params['id']"),
            @CacheEvict(value = "channelByName", allEntries = true)
    })
    public void update(Map<String, String> params) {
        Long id = Long.parseLong(params.get("id"));
        Channel c = new Channel();
        c.setId(id);
        if (params.containsKey("name")) {
            c.setName(params.get("name"));
        }
        if (params.containsKey("playerPrefix")) {
            c.setPlayerPrefix(params.get("playerPrefix"));
        }
        if (params.containsKey("notifyUrl")) {
            c.setNotifyUrl(params.get("notifyUrl"));
        }
        if (params.containsKey("offlineUrl")) {
            c.setOfflineUrl(params.get("offlineUrl"));
        }
        if (params.containsKey("domain")) {
            c.setDomain(params.get("domain"));
        }
        if (params.containsKey("gameCode")) {
            c.setGameCode(params.get("gameCode"));
        }
        if (params.containsKey("amount")) {
            c.setAmount(Long.parseLong(params.get("amount")));
        }
        if (params.containsKey("merchantId")) {
            c.setMerchantId(Long.parseLong(params.get("merchantId")));
        }
        baseMapper.updateById(c);
    }


    @Override
    public void deleteChannel(Long id) {
        if (id == 0) {
            throw new IllegalArgumentException("缺少 id");
        }
        baseMapper.deleteById(id);
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
