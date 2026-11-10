package com.politapi.service;

import java.util.Map;

public interface GameRiskControlService {

    Map<String, Object> getGameRiskControlList(Map<String, Object> params);

    boolean isGameEnabled(String gameCode);

    Long create(Map<String, Object> params);

    void update(Map<String, Object> params);

    void delete(Map<String, Object> params);
}