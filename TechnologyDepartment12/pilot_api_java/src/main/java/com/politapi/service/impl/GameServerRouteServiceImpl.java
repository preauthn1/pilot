package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.entity.GameServerRoute;
import com.politapi.mapper.GameServerRouteMapper;
import com.politapi.service.GameServerRouteService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class GameServerRouteServiceImpl implements GameServerRouteService {

    private final GameServerRouteMapper gameServerRouteMapper;

    public GameServerRouteServiceImpl(GameServerRouteMapper gameServerRouteMapper) {
        this.gameServerRouteMapper = gameServerRouteMapper;
    }

    @Override
    public List<GameServerRoute> findEnabledRoutes(String gameCode, String operationType) {
        String normalizedGameCode = normalizeRequired(gameCode, "gameCode");
        String normalizedOperationType = normalizeRequired(operationType, "operationType");
        return gameServerRouteMapper.selectList(new LambdaQueryWrapper<GameServerRoute>()
                .eq(GameServerRoute::getGameCode, normalizedGameCode)
                .eq(GameServerRoute::getOperationType, normalizedOperationType)
                .eq(GameServerRoute::getStatus, 1)
                .orderByAsc(GameServerRoute::getPriority)
                .orderByAsc(GameServerRoute::getId));
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
