package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.GameSetting;
import com.politapi.mapper.GameSettingMapper;
import com.politapi.service.GameSettingService;
import com.politapi.util.DataScopeHelper;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 游戏设置服务实现
 */
@Service
public class GameSettingServiceImpl extends ServiceImpl<GameSettingMapper, GameSetting> implements GameSettingService {

    @Override
    public Map<String, Object> getGameList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);
        LambdaQueryWrapper<GameSetting> qw = new LambdaQueryWrapper<>();
        java.util.Set<Long> allowedChannels = DataScopeHelper.getAllowedChannelIds();
        if (allowedChannels != null) {
            qw.in(GameSetting::getChannel, allowedChannels);
        }
        qw.orderByDesc(GameSetting::getId);
        IPage<GameSetting> pg = baseMapper.selectPage(Page.of(page, limit), qw);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public Long add(GameSetting gameSetting) {
        baseMapper.insert(gameSetting);
        return gameSetting.getId();
    }

    @Override
    public void update(GameSetting gameSetting) {
        baseMapper.updateById(gameSetting);
    }

    private long toLong(Object val, long defaultVal) {
        if (val == null) {
            return defaultVal;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        try {
            return Long.parseLong(val.toString());
        } catch (Exception e) {
            return defaultVal;
        }
    }
}
