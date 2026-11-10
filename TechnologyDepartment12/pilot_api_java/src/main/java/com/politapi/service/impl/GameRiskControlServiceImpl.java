package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.politapi.entity.GameRiskControl;
import com.politapi.mapper.GameRiskControlMapper;
import com.politapi.service.GameControlService;
import com.politapi.service.GameRiskControlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class GameRiskControlServiceImpl implements GameRiskControlService {

    private static final ZoneId CHINA_ZONE_ID = ZoneId.of("Asia/Shanghai");

    @Autowired
    private GameRiskControlMapper gameRiskControlMapper;

    @Autowired
    private GameControlService gameControlService;

    @Override
    public Map<String, Object> getGameRiskControlList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = Math.max(toLong(params.get("limit"), 10), 1);
        LambdaQueryWrapper<GameRiskControl> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.isNull(GameRiskControl::getDeletedAt);
        String gameCode = normalizeGameCode(params.get("gameCode"));
        if (!gameCode.isEmpty()) {
            queryWrapper.eq(GameRiskControl::getGameCode, gameCode);
        }
        queryWrapper.orderByDesc(GameRiskControl::getId);
        IPage<GameRiskControl> pageResult = gameRiskControlMapper.selectPage(Page.of(page, limit), queryWrapper);
        LocalDate currentDate = currentSystemDate();
        pageResult.getRecords().forEach(control -> {
            if (!currentDate.equals(control.getProgressDate())) {
                control.setProgress(0L);
            }
        });
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pageResult.getRecords());
        result.put("total", pageResult.getTotal());
        return result;
    }

    @Override
    public boolean isGameEnabled(String gameCode) {
        String normalizedGameCode = normalizeGameCode(gameCode);
        if (normalizedGameCode.isEmpty()) {
            return false;
        }
        return gameRiskControlMapper.selectCount(new LambdaQueryWrapper<GameRiskControl>()
                .eq(GameRiskControl::getGameCode, normalizedGameCode)
                .eq(GameRiskControl::getStatus, 1)
                .isNull(GameRiskControl::getDeletedAt)) == 1;
    }

    @Override
    public Long create(Map<String, Object> params) {
        rejectCreateFields(params);
        String gameCode = validateGameCode(params.get("gameCode"));
        Integer rebate = requireRebate(params.get("rebate"));
        Long reserve = requireReserve(params.get("reserve"));
        Long initialBet = validateBetAmount(params.get("initialBet"), "initialBet");
        Long amplitude = requireAmplitude(params.get("amplitude"));
        String btnBet = validateBtnBet(params.get("btnBet"));
        Long betMin = validateBetAmount(params.get("betMin"), "betMin");
        Long betMax = validateBetAmount(params.get("betMax"), "betMax");
        validateBetConfig(initialBet, betMin, betMax);
        Integer status = hasKey(params, "status") ? validateStatus(params.get("status")) : 0;

        GameRiskControl duplicateControl = gameRiskControlMapper.selectOne(new LambdaQueryWrapper<GameRiskControl>()
                .eq(GameRiskControl::getGameCode, gameCode)
                .isNull(GameRiskControl::getDeletedAt));
        if (duplicateControl != null) {
            throw new IllegalArgumentException("gameCode already exists");
        }

        GameRiskControl deletedControl = gameRiskControlMapper.selectOne(new LambdaQueryWrapper<GameRiskControl>()
                .eq(GameRiskControl::getGameCode, gameCode)
                .isNotNull(GameRiskControl::getDeletedAt));
        if (deletedControl != null) {
            LocalDateTime currentTime = currentChinaTime();
            LocalDate currentDate = currentSystemDate();
            gameRiskControlMapper.update(null, new UpdateWrapper<GameRiskControl>()
                    .eq("id", deletedControl.getId())
                    .set("rebate", rebate)
                    .set("reserve", reserve)
                    .set("initial_bet", initialBet)
                    .set("amplitude", amplitude)
                    .set("btn_bet", btnBet)
                    .set("bet_min", betMin)
                    .set("bet_max", betMax)
                    .set("progress", 0L)
                    .set("progress_date", currentDate)
                    .set("status", status)
                    .set("updated_at", currentTime)
                    .setSql("deleted_at = NULL"));
            reloadGameRiskControl(gameCode);
            return deletedControl.getId();
        }

        GameRiskControl createdControl = new GameRiskControl();
        createdControl.setGameCode(gameCode);
        createdControl.setRebate(rebate);
        createdControl.setReserve(reserve);
        createdControl.setInitialBet(initialBet);
        createdControl.setAmplitude(amplitude);
        createdControl.setBtnBet(btnBet);
        createdControl.setBetMin(betMin);
        createdControl.setBetMax(betMax);
        createdControl.setProgress(0L);
        createdControl.setStatus(status);
        LocalDateTime currentTime = currentChinaTime();
        createdControl.setProgressDate(currentSystemDate());
        createdControl.setCreatedAt(currentTime);
        createdControl.setUpdatedAt(currentTime);
        gameRiskControlMapper.insert(createdControl);
        reloadGameRiskControl(gameCode);
        return createdControl.getId();
    }

    @Override
    public void delete(Map<String, Object> params) {
        rejectDeleteFields(params);
        Long id = toNullableLong(params.get("id"));
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("id is required");
        }

        GameRiskControl existingControl = findActiveGameRiskControl(id);
        if (existingControl == null) {
            throw new IllegalArgumentException("game risk control not found");
        }

        LocalDateTime currentTime = currentChinaTime();
        gameRiskControlMapper.update(null, new UpdateWrapper<GameRiskControl>()
                .eq("id", id)
                .isNull("deleted_at")
                .set("status", 0)
                .set("updated_at", currentTime)
                .set("deleted_at", currentTime));
        reloadGameRiskControl(existingControl.getGameCode());
    }

    @Override
    public void update(Map<String, Object> params) {
        rejectUnsupportedFields(params);
        rejectManagedProgress(params);
        Long id = toNullableLong(params.get("id"));
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("id is required");
        }
        GameRiskControl existingControl = findActiveGameRiskControl(id);
        if (existingControl == null) {
            throw new IllegalArgumentException("game risk control not found");
        }

        String updatedGameCode = hasKey(params, "gameCode")
                ? validateGameCode(params.get("gameCode"))
                : existingControl.getGameCode();
        Integer updatedRebate = hasKey(params, "rebate")
                ? validateRebate(params.get("rebate"))
                : existingControl.getRebate();
        Long updatedReserve = hasKey(params, "reserve")
                ? validateReserve(params.get("reserve"))
                : existingControl.getReserve();
        Integer updatedStatus = hasKey(params, "status")
                ? validateStatus(params.get("status"))
                : existingControl.getStatus();
        Long updatedInitialBet = hasKey(params, "initialBet")
                ? validateBetAmount(params.get("initialBet"), "initialBet")
                : existingControl.getInitialBet();
        Long updatedAmplitude = hasKey(params, "amplitude")
                ? validateBetAmount(params.get("amplitude"), "amplitude")
                : existingControl.getAmplitude();
        String updatedBtnBet = hasKey(params, "btnBet")
                ? validateBtnBet(params.get("btnBet"))
                : existingControl.getBtnBet();
        Long updatedBetMin = hasKey(params, "betMin")
                ? validateBetAmount(params.get("betMin"), "betMin")
                : existingControl.getBetMin();
        Long updatedBetMax = hasKey(params, "betMax")
                ? validateBetAmount(params.get("betMax"), "betMax")
                : existingControl.getBetMax();
        validateBetConfig(updatedInitialBet, updatedBetMin, updatedBetMax);

        if (hasKey(params, "gameCode") && !updatedGameCode.equals(existingControl.getGameCode())) {
            GameRiskControl duplicateControl = gameRiskControlMapper.selectOne(
                    new LambdaQueryWrapper<GameRiskControl>()
                            .eq(GameRiskControl::getGameCode, updatedGameCode)
                            .isNull(GameRiskControl::getDeletedAt));
            if (duplicateControl != null) {
                throw new IllegalArgumentException("gameCode already exists");
            }
        }

        UpdateWrapper<GameRiskControl> updateWrapper = new UpdateWrapper<GameRiskControl>()
                .eq("id", id)
                .isNull("deleted_at");
        if (hasKey(params, "gameCode")) {
            updateWrapper.set("game_code", updatedGameCode);
        }
        if (hasKey(params, "rebate")) {
            setNullableInteger(updateWrapper, "rebate", updatedRebate);
        }
        if (hasKey(params, "reserve")) {
            setNullableLong(updateWrapper, "reserve", updatedReserve);
        }
        if (hasKey(params, "status")) {
            updateWrapper.set("status", updatedStatus);
        }
        if (hasKey(params, "initialBet")) {
            setNullableLong(updateWrapper, "initial_bet", updatedInitialBet);
        }
        if (hasKey(params, "amplitude")) {
            setNullableLong(updateWrapper, "amplitude", updatedAmplitude);
        }
        if (hasKey(params, "btnBet")) {
            setNullableString(updateWrapper, "btn_bet", updatedBtnBet);
        }
        if (hasKey(params, "betMin")) {
            setNullableLong(updateWrapper, "bet_min", updatedBetMin);
        }
        if (hasKey(params, "betMax")) {
            setNullableLong(updateWrapper, "bet_max", updatedBetMax);
        }
        if (hasAnyEditableField(params)) {
            LocalDateTime currentTime = currentChinaTime();
            updateWrapper.set("updated_at", currentTime);
            gameRiskControlMapper.update(null, updateWrapper);
        }
        reloadGameRiskControl(existingControl.getGameCode());
        if (!sameReloadTarget(existingControl.getGameCode(), updatedGameCode)) {
            reloadGameRiskControl(updatedGameCode);
        }
    }

    private LocalDateTime currentChinaTime() {
        return LocalDateTime.now(CHINA_ZONE_ID);
    }

    private LocalDate currentSystemDate() {
        return LocalDate.now();
    }

    private GameRiskControl findActiveGameRiskControl(Long id) {
        return gameRiskControlMapper.selectOne(new LambdaQueryWrapper<GameRiskControl>()
                .eq(GameRiskControl::getId, id)
                .isNull(GameRiskControl::getDeletedAt));
    }

    private void rejectCreateFields(Map<String, Object> params) {
        rejectUnsupportedFields(params, Set.of("gameCode", "rebate", "reserve", "status", "initialBet", "amplitude", "btnBet", "betMin", "betMax"));
    }

    private void rejectDeleteFields(Map<String, Object> params) {
        rejectUnsupportedFields(params, Set.of("id"));
    }

    private void rejectUnsupportedFields(Map<String, Object> params) {
        rejectUnsupportedFields(params, Set.of("id", "gameCode", "rebate", "reserve", "status", "progress", "initialBet", "amplitude", "btnBet", "betMin", "betMax"));
    }

    private void rejectUnsupportedFields(Map<String, Object> params, Set<String> acceptedFields) {
        for (String fieldName : params.keySet()) {
            if (!acceptedFields.contains(fieldName)) {
                throw new IllegalArgumentException("unsupported field: " + fieldName);
            }
        }
    }


    private String validateGameCode(Object value) {
        String gameCode = normalizeGameCode(value);
        if (gameCode.isEmpty()) {
            throw new IllegalArgumentException("gameCode is invalid");
        }
        return gameCode;
    }

    private Integer requireRebate(Object value) {
        Integer rebate = validateRebate(value);
        if (rebate == null) {
            throw new IllegalArgumentException("rebate is required");
        }
        return rebate;
    }

    private Long requireReserve(Object value) {
        Long reserve = validateReserve(value);
        if (reserve == null) {
            throw new IllegalArgumentException("reserve is required");
        }
        return reserve;
    }

    private Long requireAmplitude(Object value) {
        Long amplitude = validateBetAmount(value, "amplitude");
        if (amplitude == null) {
            throw new IllegalArgumentException("amplitude is required");
        }
        return amplitude;
    }


    private Integer validateRebate(Object value) {
        Integer rebate = toNullableInt(value);
        if (rebate != null && (rebate < 1 || rebate > 99)) {
            throw new IllegalArgumentException("rebate is invalid");
        }
        return rebate;
    }

    private Long validateReserve(Object value) {
        Long reserve = toNullableLong(value);
        if (reserve != null && reserve < 0) {
            throw new IllegalArgumentException("reserve is invalid");
        }
        return reserve;
    }

    private Long validateBetAmount(Object value, String fieldName) {
        Long amount = toNullableLong(value);
        if (amount != null && amount <= 0) {
            throw new IllegalArgumentException(fieldName + " is invalid");
        }
        return amount;
    }

    private String validateBtnBet(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        String normalizedValue = String.valueOf(value).trim();
        String[] amounts = normalizedValue.split(",");
        if (amounts.length > 12) {
            throw new IllegalArgumentException("btnBet is invalid");
        }
        for (String amount : amounts) {
            try {
                double parsedAmount = Double.parseDouble(amount.trim());
                if (!Double.isFinite(parsedAmount) || parsedAmount <= 0) {
                    throw new IllegalArgumentException("btnBet is invalid");
                }
            } catch (NumberFormatException exception) {
                throw new IllegalArgumentException("btnBet is invalid");
            }
        }
        return normalizedValue;
    }

    private void validateBetConfig(Long initialBet, Long betMin, Long betMax) {
        if (betMin == null && betMax == null && initialBet == null) {
            return;
        }
        if (betMin == null || betMax == null || betMin > betMax) {
            throw new IllegalArgumentException("bet range is invalid");
        }
        if (initialBet != null && (initialBet < betMin || initialBet > betMax)) {
            throw new IllegalArgumentException("initialBet is outside the bet range");
        }
    }

    private void rejectManagedProgress(Map<String, Object> params) {
        if (hasKey(params, "progress")) {
            throw new IllegalArgumentException("progress is managed by game server");
        }
    }

    private Integer validateStatus(Object value) {
        Integer status = toNullableInt(value);
        if (status == null || (status != 0 && status != 1)) {
            throw new IllegalArgumentException("status is invalid");
        }
        return status;
    }

    private void setNullableInteger(UpdateWrapper<GameRiskControl> updateWrapper, String columnName, Integer value) {
        if (value == null) {
            updateWrapper.setSql(columnName + " = NULL");
            return;
        }
        updateWrapper.set(columnName, value);
    }

    private void setNullableLong(UpdateWrapper<GameRiskControl> updateWrapper, String columnName, Long value) {
        if (value == null) {
            updateWrapper.setSql(columnName + " = NULL");
            return;
        }
        updateWrapper.set(columnName, value);
    }

    private void setNullableString(UpdateWrapper<GameRiskControl> updateWrapper, String columnName, String value) {
        if (value == null) {
            updateWrapper.setSql(columnName + " = NULL");
            return;
        }
        updateWrapper.set(columnName, value);
    }

    private boolean hasAnyEditableField(Map<String, Object> params) {
        return hasKey(params, "gameCode") || hasKey(params, "rebate")
                || hasKey(params, "reserve") || hasKey(params, "status")
                || hasKey(params, "initialBet") || hasKey(params, "amplitude")
                || hasKey(params, "btnBet")
                || hasKey(params, "betMin") || hasKey(params, "betMax");
    }

    private void reloadGameRiskControl(String gameCode) {
        if (gameCode == null || normalizeGameCode(gameCode).isEmpty()) {
            return;
        }
        gameControlService.reloadGameRiskControl(gameCode);
    }

    private boolean sameReloadTarget(String firstGameCode, String secondGameCode) {
        return normalizeGameCode(firstGameCode).equals(normalizeGameCode(secondGameCode));
    }

    private boolean hasKey(Map<String, Object> params, String key) {
        return params.containsKey(key);
    }

    private String normalizeGameCode(Object value) {
        return value == null ? "" : String.valueOf(value).trim().toLowerCase(Locale.ROOT);
    }

    private Long toNullableLong(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }

    private Integer toNullableInt(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private long toLong(Object value, long defaultValue) {
        try {
            Long parsedValue = toNullableLong(value);
            return parsedValue == null ? defaultValue : parsedValue;
        } catch (NumberFormatException exception) {
            return defaultValue;
        }
    }
}
