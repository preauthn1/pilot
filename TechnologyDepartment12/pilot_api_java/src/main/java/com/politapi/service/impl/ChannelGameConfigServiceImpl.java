package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.politapi.entity.ChannelGameConfig;
import com.politapi.mapper.ChannelGameConfigMapper;
import com.politapi.service.ChannelGameConfigService;
import com.politapi.service.GameControlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ChannelGameConfigServiceImpl implements ChannelGameConfigService {

    @Autowired
    private ChannelGameConfigMapper channelGameConfigMapper;

    @Autowired
    private GameControlService gameControlService;

    @Override
    public Map<String, Object> getChannelGameConfigList(Map<String, Object> params) {
        long page = Math.max(toLong(pick(params, "offset", "page"), 1), 1);
        long limit = Math.max(toLong(params.get("limit"), 10), 1);

        LambdaQueryWrapper<ChannelGameConfig> qw = new LambdaQueryWrapper<>();
        Long channelId = toNullableLong(pick(params, "channelId", "channel_id"));
        if (channelId != null) {
            qw.eq(ChannelGameConfig::getChannelId, channelId);
        }
        String gameCode = normalizeGameCode(pick(params, "gameCode", "game_code"));
        if (!gameCode.isEmpty()) {
            qw.eq(ChannelGameConfig::getGameCode, gameCode);
        }
        Integer status = toNullableInt(params.get("status"));
        if (status != null) {
            qw.eq(ChannelGameConfig::getStatus, status);
        }
        qw.orderByDesc(ChannelGameConfig::getId);

        IPage<ChannelGameConfig> pg = channelGameConfigMapper.selectPage(Page.of(page, limit), qw);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public Long create(Map<String, Object> params) {
        rejectManagedProgress(params);
        ChannelGameConfig config = new ChannelGameConfig();
        applyRequiredFields(config, params);
        applyOptionalFields(config, params);
        if (config.getStatus() == null) {
            config.setStatus(1);
        }
        initializeProgressForCreate(config);
        channelGameConfigMapper.insert(config);
        reloadGameControlConfig(config);
        return config.getId();
    }

    @Override
    public void update(Map<String, Object> params) {
        rejectManagedProgress(params);
        Long id = toNullableLong(params.get("id"));
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("id is required");
        }
        ChannelGameConfig existingConfig = channelGameConfigMapper.selectById(id);
        if (existingConfig == null) {
            throw new IllegalArgumentException("channel game config not found");
        }
        ChannelGameConfig changedConfig = new ChannelGameConfig();
        changedConfig.setId(id);
        applyOptionalFields(changedConfig, params);
        ChannelGameConfig updatedConfig = resolveUpdatedConfig(changedConfig, existingConfig, params);
        updateSpecifiedFields(id, existingConfig, updatedConfig, params);
        reloadGameControlConfig(existingConfig, updatedConfig);
    }

    @Override
    public void delete(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("id is required");
        }
        ChannelGameConfig existingConfig = channelGameConfigMapper.selectById(id);
        if (existingConfig == null) {
            throw new IllegalArgumentException("channel game config not found");
        }
        channelGameConfigMapper.deleteById(id);
        reloadGameControlConfig(existingConfig);
    }

    private void rejectManagedProgress(Map<String, Object> params) {
        if (hasAny(params, "progress")) {
            throw new IllegalArgumentException("progress is managed by game server");
        }
    }

    private void applyRequiredFields(ChannelGameConfig config, Map<String, Object> params) {
        Long channelId = toNullableLong(pick(params, "channelId", "channel_id"));
        String gameCode = normalizeGameCode(pick(params, "gameCode", "game_code"));
        if (channelId == null || channelId <= 0) {
            throw new IllegalArgumentException("channelId is required");
        }
        if (gameCode.isEmpty()) {
            throw new IllegalArgumentException("gameCode is required");
        }
        config.setChannelId(channelId);
        config.setGameCode(gameCode);
    }

    private void applyOptionalFields(ChannelGameConfig config, Map<String, Object> params) {
        if (hasAny(params, "channelId", "channel_id")) {
            Long channelId = toNullableLong(pick(params, "channelId", "channel_id"));
            if (channelId == null || channelId <= 0) {
                throw new IllegalArgumentException("channelId is invalid");
            }
            config.setChannelId(channelId);
        }
        if (hasAny(params, "gameCode", "game_code")) {
            String gameCode = normalizeGameCode(pick(params, "gameCode", "game_code"));
            if (gameCode.isEmpty()) {
                throw new IllegalArgumentException("gameCode is invalid");
            }
            config.setGameCode(gameCode);
        }
        if (hasAny(params, "domain")) {
            config.setDomain(stringValue(params.get("domain")));
        }
        if (hasAny(params, "status")) {
            Integer status = toNullableInt(params.get("status"));
            if (status == null || (status != 0 && status != 1)) {
                throw new IllegalArgumentException("status is invalid");
            }
            config.setStatus(status);
        }
        if (hasAny(params, "serverConfigId", "server_config_id")) {
            config.setServerConfigId(toNullableLong(pick(params, "serverConfigId", "server_config_id")));
        }
        if (hasAny(params, "gameSettingId", "game_setting_id")) {
            config.setGameSettingId(toNullableLong(pick(params, "gameSettingId", "game_setting_id")));
        }
        if (hasAny(params, "rebate")) {
            Integer rebate = toNullableInt(params.get("rebate"));
            if (rebate != null && (rebate < 1 || rebate > 99)) {
                throw new IllegalArgumentException("rebate is invalid");
            }
            config.setRebate(rebate);
        }
        if (hasAny(params, "reserve")) {
            config.setReserve(toNullableLong(params.get("reserve")));
        }
        if (hasAny(params, "progress")) {
            config.setProgress(toNullableLong(params.get("progress")));
        }
    }

    private ChannelGameConfig resolveUpdatedConfig(
            ChannelGameConfig changedConfig,
            ChannelGameConfig existingConfig,
            Map<String, Object> params) {
        ChannelGameConfig updatedConfig = new ChannelGameConfig();
        updatedConfig.setId(existingConfig.getId());
        updatedConfig.setChannelId(hasAny(params, "channelId", "channel_id")
                ? changedConfig.getChannelId() : existingConfig.getChannelId());
        updatedConfig.setGameCode(hasAny(params, "gameCode", "game_code")
                ? changedConfig.getGameCode() : existingConfig.getGameCode());
        updatedConfig.setStatus(hasAny(params, "status") ? changedConfig.getStatus() : existingConfig.getStatus());
        updatedConfig.setRebate(hasAny(params, "rebate") ? changedConfig.getRebate() : existingConfig.getRebate());
        updatedConfig.setReserve(hasAny(params, "reserve") ? changedConfig.getReserve() : existingConfig.getReserve());
        return updatedConfig;
    }
    private void initializeProgressForCreate(ChannelGameConfig config) {
        if (hasCompleteIndependentControl(config)) {
            config.setProgress(0L);
        }
    }

    private void updateProgressForIndependentControl(
            UpdateWrapper<ChannelGameConfig> updateWrapper,
            ChannelGameConfig existingConfig,
            ChannelGameConfig updatedConfig,
            Map<String, Object> params) {
        if (!hasAny(params, "rebate", "reserve")) {
            return;
        }
        if (!hasCompleteIndependentControl(updatedConfig)) {
            updateWrapper.setSql("progress = NULL");
            return;
        }
        if (existingConfig.getProgress() == null) {
            updateWrapper.set("progress", 0L);
        }
    }
    private boolean hasCompleteIndependentControl(ChannelGameConfig config) {
        return config.getRebate() != null && config.getReserve() != null;
    }
    private void updateSpecifiedFields(
            Long id,
            ChannelGameConfig existingConfig,
            ChannelGameConfig updatedConfig,
            Map<String, Object> params) {
        UpdateWrapper<ChannelGameConfig> updateWrapper = new UpdateWrapper<ChannelGameConfig>()
                .eq("id", id);
        if (hasAny(params, "channelId", "channel_id")) {
            updateWrapper.set("channel_id", updatedConfig.getChannelId());
        }
        if (hasAny(params, "gameCode", "game_code")) {
            updateWrapper.set("game_code", updatedConfig.getGameCode());
        }
        if (hasAny(params, "domain")) {
            updateWrapper.set("domain", stringValue(params.get("domain")));
        }
        if (hasAny(params, "status")) {
            updateWrapper.set("status", updatedConfig.getStatus());
        }
        if (hasAny(params, "serverConfigId", "server_config_id")) updateWrapper.set("server_config_id",
                toNullableLong(pick(params, "serverConfigId", "server_config_id")));
        if (hasAny(params, "gameSettingId", "game_setting_id")) updateWrapper.set("game_setting_id",
                toNullableLong(pick(params, "gameSettingId", "game_setting_id")));
        setNullableIntegerField(updateWrapper, params, "rebate");
        setNullableLongField(updateWrapper, params, "reserve");
        updateProgressForIndependentControl(updateWrapper, existingConfig, updatedConfig, params);
        channelGameConfigMapper.update(null, updateWrapper);
    }

    private void setNullableIntegerField(UpdateWrapper<ChannelGameConfig> updateWrapper, Map<String, Object> params, String columnName) {
        if (!hasAny(params, columnName)) {
            return;
        }
        Integer value = toNullableInt(params.get(columnName));
        if (value == null) {
            updateWrapper.setSql(columnName + " = NULL");
            return;
        }
        updateWrapper.set(columnName, value);
    }

    private void setNullableLongField(UpdateWrapper<ChannelGameConfig> updateWrapper, Map<String, Object> params, String columnName) {
        if (!hasAny(params, columnName)) {
            return;
        }
        Long value = toNullableLong(params.get(columnName));
        if (value == null) {
            updateWrapper.setSql(columnName + " = NULL");
            return;
        }
        updateWrapper.set(columnName, value);
    }

    private void reloadGameControlConfig(ChannelGameConfig existingConfig, ChannelGameConfig updatedConfig) {
        if (!hasSameReloadTarget(existingConfig, updatedConfig)) {
            gameControlService.reloadControlConfig(existingConfig);
        }
        gameControlService.reloadControlConfig(updatedConfig);
    }

    private boolean hasSameReloadTarget(ChannelGameConfig firstConfig, ChannelGameConfig secondConfig) {
        return java.util.Objects.equals(firstConfig.getChannelId(), secondConfig.getChannelId())
                && normalizeGameCode(firstConfig.getGameCode()).equals(normalizeGameCode(secondConfig.getGameCode()));
    }

    private void reloadGameControlConfig(ChannelGameConfig config) {
        gameControlService.reloadControlConfig(config);
    }
    private Object pick(Map<String, Object> params, String... keys) {
        for (String key : keys) {
            if (params.containsKey(key)) {
                return params.get(key);
            }
        }
        return null;
    }

    private boolean hasAny(Map<String, Object> params, String... keys) {
        for (String key : keys) {
            if (params.containsKey(key)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeGameCode(Object value) {
        return stringValue(value).trim().toLowerCase();
    }

    private String stringValue(Object value) {
        return value == null ? "" : value.toString();
    }

    private Long toNullableLong(Object val) {
        if (val == null || val.toString().isBlank()) {
            return null;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        return Long.parseLong(val.toString());
    }

    private Integer toNullableInt(Object val) {
        if (val == null || val.toString().isBlank()) {
            return null;
        }
        if (val instanceof Number) {
            return ((Number) val).intValue();
        }
        return Integer.parseInt(val.toString());
    }

    private long toLong(Object val, long defaultVal) {
        try {
            Long parsed = toNullableLong(val);
            return parsed == null ? defaultVal : parsed;
        } catch (Exception e) {
            return defaultVal;
        }
    }
}
