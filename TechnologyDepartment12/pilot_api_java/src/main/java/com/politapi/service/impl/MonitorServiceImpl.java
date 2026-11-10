package com.politapi.service.impl;

import com.politapi.entity.ServerConfig;
import com.politapi.mapper.GameRecordMapper;
import com.politapi.mapper.ServerConfigMapper;
import com.politapi.service.MonitorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class MonitorServiceImpl implements MonitorService {

    @Autowired private ServerConfigMapper serverConfigMapper;
    @Autowired private GameRecordMapper gameRecordMapper;

    @Override
    public Map<String, Object> monitorLogin(Long adminId, String gameCode) {
        if (adminId == null) {
            adminId = 1L;
        }

        String normalizedGameCode = gameCode == null ? "" : gameCode.trim().toLowerCase(Locale.ROOT);
        if (normalizedGameCode.isEmpty()) {
            throw new IllegalArgumentException("gameCode is required");
        }

        ServerConfig serverConfig = serverConfigMapper.selectList(null).stream().findFirst().orElse(null);
        if (serverConfig == null || serverConfig.getSecret() == null) {
            throw new IllegalArgumentException("No server configuration found");
        }

        byte[] iv = new byte[16];
        SecureRandom secureRandom = new SecureRandom();
        secureRandom.nextBytes(iv);
        String token = GameServerConfigServiceImpl.generateWsToken(
                serverConfig.getSecret(), adminId, normalizedGameCode,
                System.currentTimeMillis(), secureRandom.nextInt(10000), iv);

        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        long winOrLoss = gameRecordMapper.sumSettlementBetween(
                today + " 00:00:00", today + " 23:59:59", normalizedGameCode);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", token);
        result.put("gameCode", normalizedGameCode);
        result.put("winOrLoss", winOrLoss);
        return result;
    }
}
