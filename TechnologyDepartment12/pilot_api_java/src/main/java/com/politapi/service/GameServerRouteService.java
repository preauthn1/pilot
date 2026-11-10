package com.politapi.service;

import com.politapi.entity.GameServerRoute;

import java.util.List;

public interface GameServerRouteService {
    List<GameServerRoute> findEnabledRoutes(String gameCode, String operationType);
}
