package com.politapi.controller.api;

import com.politapi.common.Result;
import com.politapi.service.FreeBetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 供游戏服内部调用的免费下注接口（内部网络，无需验签）
 * POST /api/freeBet/use     — 使用（扣减）免费次数
 * POST /api/freeBet/recover — 取消下注时恢复免费次数
 */
@Slf4j
@RestController("freeBetInternalController")
@RequestMapping("/api/freeBet")
@Tag(name = "免费下注-内部", description = "游戏控制服内部调用：使用/恢复免费次数（无需验签）")
public class FreeBetInternalController {

    @Autowired
    private FreeBetService freeBetService;

    @PostMapping("/use")
    @Operation(summary = "使用免费次数", description = "游戏服下注时调用，扣减一次免费次数。参数: userId, channelId, roundId, gameCode（可选）")
    public Result<?> use(@RequestParam Long userId,
                         @RequestParam Long channelId,
                         @RequestParam String roundId,
                         @RequestParam(required = false) String gameCode) {
        try {
            String resolvedGameCode = gameCode == null || gameCode.isBlank() ? null : gameCode.trim();
            boolean success = freeBetService.useFreeBet(userId, channelId, roundId, resolvedGameCode);
            if (!success) {
                return Result.fail(500, "免费次数不足");
            }
            Map<String, Object> data = new HashMap<>();
            data.put("success", true);
            data.put("remainCount", freeBetService.getRemainCount(userId, channelId, resolvedGameCode));
            return Result.ok(data);
        } catch (Exception e) {
            log.error("扣减免费次数异常", e);
            return Result.fail(500, "服务异常");
        }
    }

    @PostMapping("/internal/remain")
    @Operation(summary = "Query remaining free bets", description = "Game-server entry lookup for the authoritative remaining count. Parameters: userId, channelId, gameCode (optional)")
    public Result<?> remain(@RequestParam Long userId,
                            @RequestParam Long channelId,
                            @RequestParam(required = false) String gameCode) {
        if (userId == null || userId <= 0 || channelId == null || channelId <= 0) {
            return Result.fail(400, "\u53c2\u6570\u4e0d\u5b8c\u6574");
        }
        try {
            String resolvedGameCode = gameCode == null || gameCode.isBlank() ? null : gameCode.trim();
            Map<String, Object> data = new HashMap<>();
            data.put("remainCount", freeBetService.getRemainCount(userId, channelId, resolvedGameCode));
            data.put("freeBetAmount", freeBetService.getFreeBetAmount(channelId));
            return Result.ok(data);
        } catch (Exception e) {
            log.error("Failed to query remaining free bets", e);
            return Result.fail(500, "Service error");
        }
    }

    @PostMapping("/recover")
    @Operation(summary = "恢复免费次数", description = "游戏服取消下注时调用，恢复一次免费次数。参数: userId, channelId, roundId")
    public Result<?> recover(@RequestParam Long userId,
                             @RequestParam Long channelId,
                             @RequestParam String roundId) {
        try {
            freeBetService.recoverFreeBet(userId, channelId, roundId);
            Map<String, Object> data = new HashMap<>();
            data.put("success", true);
            return Result.ok(data);
        } catch (Exception e) {
            log.error("恢复免费次数异常", e);
            return Result.fail(500, "服务异常");
        }
    }
}
