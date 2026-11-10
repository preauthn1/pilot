package com.politapi.controller.api;

import com.politapi.common.Result;
import com.politapi.controller.BaseController;
import com.politapi.dto.request.FreeBetGrantRequest;
import com.politapi.dto.request.FreeBetRemainRequest;
import com.politapi.service.FreeBetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 对外开放 - 免费下注接口（活动系统调用）
 * <p>
 * 提供发放免费次数和查询剩余次数两个核心接口，
 * 所有业务逻辑下沉到 {@link FreeBetService}，Controller 仅负责参数转换和结果透传。
 * </p>
 */
@Slf4j
@RestController("apiFreeBetController")
@RequestMapping("/api/freeBet")
@Tag(name = "免费下注",
        description = "" +
                "免费下注发放、查询接口，供上游活动系统调用。\n\n" +
                "签名算法（MD5）：\n" +
                "1. 将除 sign 外的所有参数按 key 字母序排列\n" +
                "2. 拼接为 key=value&key=value 格式（过滤 null 值）\n" +
                "3. 末尾追加 key=密钥\n" +
                "4. 对整串做 MD5 小写\n\n" +
                "注意：所有参数 key 必须为小写驼峰。expireAt 格式 yyyy-MM-dd HH:mm:ss（username/channel/count/multiple/gameCode/activityId/sourceOrderId/expireAt/timestamp）")
public class FreeBetController extends BaseController {

    @Autowired
    private FreeBetService freeBetService;

    // 错误码常量
    private static final int ERR_SIGN = 401;

    /**
     * 发放免费次数接口（活动系统调用）
     * POST /api/freeBet/grant
     */
    @PostMapping("/grant")
    @Operation(summary = "发放免费次数", description = "活动系统调用此接口为用户发放免费下注次数。支持幂等（sourceOrderId），需要验签。")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "发放成功"),
            @ApiResponse(responseCode = "401", description = "验签失败"),
            @ApiResponse(responseCode = "105", description = "订单已处理（幂等命中）"),
            @ApiResponse(responseCode = "304", description = "用户不存在"),
            @ApiResponse(responseCode = "201", description = "渠道不存在"),
            @ApiResponse(responseCode = "402", description = "渠道未开启免费下注"),
            @ApiResponse(responseCode = "404", description = "count 非法"),
            @ApiResponse(responseCode = "405", description = "过期时间异常"),
            @ApiResponse(responseCode = "406", description = "multiple 非法"),
            @ApiResponse(responseCode = "407", description = "gameCode 非法")
    })
    public Result<?> grant(@RequestBody FreeBetGrantRequest req) {
        Map<String, Object> itemResult = grantItem(req);
        int code = (Integer) itemResult.get("code");
        if (code == 0) {
            return Result.ok(itemResult.get("data"));
        }
        return fail(code, (String) itemResult.get("message"));
    }

    /**
     * 批量发放免费次数。请求体是数组，每一条单独验签、单独入账。
     * POST /api/freeBet/grantBatch
     */
    @PostMapping("/grantBatch")
    @Operation(summary = "批量发放免费次数", description = "请求体为发放对象数组，最多 100 条。每条使用与单个发放相同的字段和签名。某一条失败不影响其他条。")
    public Result<?> grantBatch(@RequestBody List<FreeBetGrantRequest> items) {
        log.info("上游批量发放免费次数请求数据: {}", items);

        if (items == null || items.isEmpty()) {
            return fail(400, "集合不能为空");
        }
        if (items.size() > 100) {
            return fail(400, "集合最多 100 条");
        }
        List<Map<String, Object>> results = new ArrayList<>();
        for (FreeBetGrantRequest item : items) {
            results.add(grantItem(item));
        }
        return Result.ok(results);
    }

    private Map<String, Object> grantItem(FreeBetGrantRequest req) {
        Map<String, Object> itemResult = new HashMap<>();
        itemResult.put("sourceOrderId", req == null ? null : req.getSourceOrderId());
        try {
            if (req == null) {
                itemResult.put("code", 400);
                itemResult.put("message", "参数不完整");
                return itemResult;
            }
            if (req.getCount() != null && req.getCount() <= 0) {
                itemResult.put("code", 404);
                itemResult.put("message", "count 非法（≤0）");
                return itemResult;
            }
            if (!isValidMultiple(req.getMultiple())) {
                itemResult.put("code", 406);
                itemResult.put("message", "multiple 非法");
                return itemResult;
            }
            String gameCode = normalizeGameCode(req.getGameCode());
            if (gameCode.length() > 64) {
                itemResult.put("code", 407);
                itemResult.put("message", "gameCode 非法");
                return itemResult;
            }

            if (!freeBetService.verifyRequestSign(toParamsMap(req), req.getSign())) {
                log.warn("免费下注发放验签失败: username={}, channel={}", req.getUsername(), req.getChannel());
                itemResult.put("code", ERR_SIGN);
                itemResult.put("message", "验签失败");
                return itemResult;
            }

            LocalDateTime expireAt = null;
            if (req.getExpireAt() != null && !req.getExpireAt().isEmpty()) {
                try {
                    expireAt = LocalDateTime.parse(req.getExpireAt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                } catch (Exception e) {
                    log.error("解析过期时间失败: {}", req.getExpireAt(), e);
                }
            }

            Map<String, Object> grantResult = freeBetService.grant(
                    req.getUsername(), req.getChannel(), req.getCount(), req.getActivityId(),
                    req.getSourceOrderId(), expireAt, req.getMultiple(), gameCode);

            int code = (Integer) grantResult.get("code");
            itemResult.put("code", code);
            itemResult.put("message", grantResult.get("message") == null ? "success" : grantResult.get("message"));
            if (grantResult.get("data") != null) {
                itemResult.put("data", grantResult.get("data"));
            }
            return itemResult;
        } catch (Exception e) {
            log.error("发放免费次数异常", e);
            itemResult.put("code", 500);
            itemResult.put("message", "服务异常");
            return itemResult;
        }
    }

    /**
     * 查询剩余次数接口
     * POST /api/freeBet/remain
     */
    @PostMapping("/remain")
    @Operation(summary = "查询剩余次数", description = "查询用户在指定渠道的免费下注剩余次数、单次金额和最近过期时间")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "401", description = "验签失败"),
            @ApiResponse(responseCode = "304", description = "用户不存在"),
            @ApiResponse(responseCode = "201", description = "渠道不存在")
    })
    public Result<?> remain(@RequestBody FreeBetRemainRequest req) {
        try {
            // 转换为 Map 用于验签
            Map<String, Object> params = new HashMap<>();
            params.put("username", req.getUsername());
            params.put("channel", req.getChannel());
            params.put("sign", req.getSign());

            // 验签
            if (!freeBetService.verifyRequestSign(params, req.getSign())) {
                log.warn("免费下注查询验签失败: username={}, channel={}", req.getUsername(), req.getChannel());
                return fail(ERR_SIGN, "验签失败");
            }

            // 调用 Service 统一查询（用户校验 + 渠道解析 + 游戏配置 + 剩余次数）
            Map<String, Object> remainResult = freeBetService.getRemainInfo(req.getUsername(), req.getChannel());

            int code = (Integer) remainResult.get("code");
            if (code == 0) {
                return Result.ok(remainResult.get("data"));
            } else {
                String message = (String) remainResult.get("message");
                return fail(code, message);
            }

        } catch (Exception e) {
            log.error("查询剩余次数异常", e);
            return fail("服务异常");
        }
    }

    // ==================== 辅助方法 ====================

    /**
     * 将 DTO 转为 Map（用于验签）
     */
    private Map<String, Object> toParamsMap(FreeBetGrantRequest req) {
        Map<String, Object> map = new HashMap<>();
        map.put("username", req.getUsername());
        map.put("channel", req.getChannel());
        if (req.getCount() != null) {
            map.put("count", req.getCount());
        }
        if (req.getMultiple() != null) {
            map.put("multiple", req.getMultiple());
        }
        String gameCode = normalizeGameCode(req.getGameCode());
        if (!gameCode.isEmpty()) {
            map.put("gameCode", gameCode);
        }
        if (req.getActivityId() != null) {
            map.put("activityId", req.getActivityId());
        }
        if (req.getSourceOrderId() != null) {
            map.put("sourceOrderId", req.getSourceOrderId());
        }
        if (req.getExpireAt() != null) {
            map.put("expireAt", req.getExpireAt());
        }
        if (req.getTimestamp() != null) {
            map.put("timestamp", req.getTimestamp());
        }
        map.put("sign", req.getSign());
        return map;
    }

    private boolean isValidMultiple(Integer multiple) {
        return multiple != null && multiple > 0;
    }

    private String normalizeGameCode(String gameCode) {
        return gameCode == null ? "" : gameCode.trim();
    }
}
