package com.politapi.service.impl;

import cn.hutool.crypto.SecureUtil;
import com.alibaba.fastjson.JSONObject;
import com.politapi.entity.ChannelGameConfig;
import com.politapi.service.GameControlService;
import com.politapi.util.HttpUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * 游戏控制服务实现
 */
@Slf4j
@Service
public class GameControlServiceImpl implements GameControlService {

    @Value("${game.control.url:http://127.0.0.1:9000}")
    private String controlServerUrl;

    @Value("${game.control.key:5dfa8c73449f6299}")
    private String controlServerKey;

    @Override
    public Map<String, Object> realTimeSettlement(Map<String, Object> params, Long adminId) {
        Object roundIdObj = params.get("roundId");
        if (roundIdObj == null || String.valueOf(roundIdObj).isBlank()) {
            roundIdObj = params.get("round_id");
        }
        if (roundIdObj == null || String.valueOf(roundIdObj).isBlank()) {
            throw new IllegalArgumentException("roundId is required");
        }

        if (adminId == null) {
            adminId = 1L;
        }

        String roundId = String.valueOf(roundIdObj);
        String gameCode = normalizeGameCode(params.get("gameCode"));
        if (gameCode.isEmpty()) {
            throw new IllegalArgumentException("gameCode is required");
        }
        String timestamp = String.valueOf(System.currentTimeMillis());
        Map<String, Object> postData = new LinkedHashMap<>();
        postData.put("operatorId", adminId);
        postData.put("roundId", roundId);
        postData.put("gameCode", gameCode);
        postData.put("timestamp", timestamp);
        String signStr = "gameCode=" + gameCode + "&operatorId=" + adminId + "&roundId=" + roundId + "&timestamp=" + timestamp + "&key=" + controlServerKey;
        postData.put("sign", SecureUtil.md5(signStr));

        JSONObject ret = HttpUtil.postJson(controlServerUrl + "/control/cashOut", postData);
        int code = ret.getIntValue("code");
        if (code != 0) {
            String msg = switch (code) {
                case 1 -> "control server param error";
                case 3 -> "control server sign error";
                case 4 -> "roundId mismatch";
                case 5 -> "game is not running";
                case 6 -> "force settlement failed";
                default -> "force settlement failed: " + code;
            };
            throw new RuntimeException(msg);
        }
        return ret;
    }

    @Override
    public void reloadControlConfig(ChannelGameConfig channelGameConfig) {
        if (channelGameConfig == null) {
            return;
        }
        String gameCode = normalizeGameCode(channelGameConfig.getGameCode());
        if (channelGameConfig.getChannelId() == null || gameCode.isEmpty()) {
            log.warn("渠道游戏控制重载目标不完整: mappingId={}", channelGameConfig.getId());
            return;
        }
        notifyControlConfig(new ControlReloadTarget(channelGameConfig.getChannelId(), gameCode));
    }

    @Override
    public void reloadGameRiskControl(String gameCode) {
        String normalizedGameCode = normalizeGameCode(gameCode);
        if (normalizedGameCode.isEmpty()) {
            log.warn("Missing global game risk reload target");
            return;
        }
        notifyGameRiskControl(normalizedGameCode);
    }

    private void notifyGameRiskControl(String gameCode) {
        try {
            String timestamp = String.valueOf(System.currentTimeMillis());
            String signStr = "timestamp=" + timestamp + "&key=" + controlServerKey;
            Map<String, Object> postData = new LinkedHashMap<>();
            postData.put("gameCode", gameCode);
            postData.put("timestamp", timestamp);
            postData.put("sign", SecureUtil.md5(signStr));

            JSONObject response = HttpUtil.postJson(controlServerUrl + "/control/game-risk", postData);
            int code = response.getIntValue("code");
            if (code != 0) {
                log.warn("Failed to reload global game risk: code={}, msg={}, gameCode={}",
                        code, response.getString("msg"), gameCode);
                return;
            }
            log.info("Reloaded global game risk: gameCode={}", gameCode);
        } catch (Exception exception) {
            log.warn("Global game risk reload failed: gameCode={}, error={}", gameCode, exception.getMessage());
        }
    }

    private void notifyControlConfig(ControlReloadTarget target) {
        try {
            String timestamp = String.valueOf(System.currentTimeMillis());
            String signStr = "timestamp=" + timestamp + "&key=" + controlServerKey;
            Map<String, Object> postData = new LinkedHashMap<>();
            postData.put("channel", target.channelId());
            postData.put("gameCode", target.gameCode());
            postData.put("timestamp", timestamp);
            postData.put("sign", SecureUtil.md5(signStr));

            JSONObject ret = HttpUtil.postJson(controlServerUrl + "/control/config", postData);
            int code = ret.getIntValue("code");
            if (code != 0) {
                log.warn("Game-server control reload failed: code={}, msg={}, gameCode={}, channel={}",
                        code, ret.getString("msg"), target.gameCode(), target.channelId());
            } else {
                log.info("Game-server control reload completed: gameCode={}, channel={}",
                        target.gameCode(), target.channelId());
            }
        } catch (Exception exception) {
            log.warn("Game-server control reload failed: gameCode={}, channel={}, error={}",
                    target.gameCode(), target.channelId(), exception.getMessage());
        }
    }

    private String normalizeGameCode(Object value) {
        return value == null ? "" : String.valueOf(value).trim().toLowerCase(Locale.ROOT);
    }

    private record ControlReloadTarget(Long channelId, String gameCode) {}
}
