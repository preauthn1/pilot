package com.politapi.controller.api;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.common.Result;
import com.politapi.dto.request.ChannelQueryRequest;
import com.politapi.entity.Channel;
import com.politapi.entity.GameRiskControl;
import com.politapi.entity.GameSetting;
import com.politapi.mapper.ChannelMapper;
import com.politapi.mapper.GameRiskControlMapper;
import com.politapi.mapper.GameSettingMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 对外开放 - 游戏设置
 */
@RestController("apiGameSettingController")
@RequestMapping("/api")
@Tag(name = "游戏设置", description = "游戏前端获取游戏规则、投注范围等配置")
public class GameSettingController {

    @Autowired private GameSettingMapper gameSettingMapper;
    @Autowired private ChannelMapper channelMapper;
    @Autowired private GameRiskControlMapper gameRiskControlMapper;

    public static final int NO_EXIST_CHANNEL = 201;

    /**
     * 获取游戏设置（飞机前端调用，返回单条）
     */
    @GetMapping("/gameSetting")
    @Operation(summary = "获取游戏设置", description = "游戏前端调用，返回第一条游戏设置（投注额、振幅、结算倍数、规则等）")
    public Result<?> gameSetting(@RequestParam(required = false) String gameCode) {
        List<GameSetting> list = gameSettingMapper.selectList(
                new LambdaQueryWrapper<GameSetting>().last("LIMIT 1"));
        GameSetting setting = (list != null && !list.isEmpty()) ? list.get(0) : null;
        if (setting == null) {
            return Result.fail("没有对应配置信息");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", setting.getId());
        data.put("initialBet", formatBetAmount(gameCode, setting.getInitialBet()));
        data.put("btnBet", setting.getBtnBet());
        data.put("amplitude", (setting.getAmplitude() != null ? setting.getAmplitude().doubleValue() / 100 : 0));
        data.put("betMin", formatBetAmount(gameCode, setting.getBetMin()));
        data.put("betMax", formatBetAmount(gameCode, setting.getBetMax()));
        data.put("settlementMin", setting.getSettlementMin());
        data.put("settlementMax", setting.getSettlementMax());
        data.put("channel", setting.getChannel());
        data.put("ruleContent", setting.getRuleContent());
        data.put("system", setting.getSystem());
        applyGlobalGameConfig(data, gameCode);
        return Result.ok(data);
    }

    private void applyGlobalGameConfig(Map<String, Object> data, String gameCode) {
        String normalizedGameCode = normalizeGameCode(gameCode);
        if (normalizedGameCode.isEmpty()) {
            return;
        }
        GameRiskControl riskControl = gameRiskControlMapper.selectOne(new LambdaQueryWrapper<GameRiskControl>()
                .eq(GameRiskControl::getGameCode, normalizedGameCode)
                .eq(GameRiskControl::getStatus, 1)
                .isNull(GameRiskControl::getDeletedAt)
                .last("LIMIT 1"));
        if (riskControl == null) {
            return;
        }
        if (riskControl.getAmplitude() != null) {
            data.put("amplitude", riskControl.getAmplitude().doubleValue() / 100);
        }
        if (hasCompleteBetConfig(riskControl)) {
            data.put("initialBet", formatBetAmount(gameCode, riskControl.getInitialBet()));
            data.put("btnBet", riskControl.getBtnBet());
            data.put("betMin", formatBetAmount(gameCode, riskControl.getBetMin()));
            data.put("betMax", formatBetAmount(gameCode, riskControl.getBetMax()));
        }
    }

    private Number formatBetAmount(String gameCode, Long amountInFen) {
        if (amountInFen == null) {
            return null;
        }
        if (isYuanUnitGame(gameCode)) {
            return amountInFen / 100.0;
        }
        return amountInFen;
    }

    private boolean isYuanUnitGame(String gameCode) {
        return normalizeGameCode(gameCode).contains("chicken");
    }

    private boolean hasCompleteBetConfig(GameRiskControl riskControl) {
        return riskControl != null
                && riskControl.getInitialBet() != null
                && riskControl.getBtnBet() != null
                && !riskControl.getBtnBet().isBlank()
                && riskControl.getBetMin() != null
                && riskControl.getBetMax() != null;
    }

    private String normalizeGameCode(String gameCode) {
        return gameCode == null ? "" : gameCode.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * 根据渠道获取游戏设置列表
     */
    @PostMapping("/game/getSetting")
    @Operation(summary = "按渠道获取游戏设置", description = "传入渠道名称获取该渠道的游戏设置列表，不传则返回全部")
    public Result<?> getGameSetting(@RequestBody ChannelQueryRequest req) {
        String channelName = req.getChannel();

        Long channelId = null;
        if (channelName != null && !channelName.isEmpty()) {
            Channel channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
            if (channel == null) {
                return Result.fail(NO_EXIST_CHANNEL, "渠道不存在");
            }
            channelId = channel.getId();
        }

        List<GameSetting> settings;
        if (channelId != null) {
            settings = gameSettingMapper.selectList(
                    new LambdaQueryWrapper<GameSetting>().eq(GameSetting::getChannel, channelId));
        } else {
            settings = gameSettingMapper.selectList(null);
        }

        return Result.ok(settings);
    }
}
