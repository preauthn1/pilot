package com.politapi.controller.api;

import com.alibaba.fastjson.JSONObject;
import com.politapi.service.ProService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 游戏核心接口
 * game-server 通过 application/x-www-form-urlencoded 调用，使用 @RequestParam 接收
 */
@RestController("apiProController")
@RequestMapping("/api")
@Tag(name = "游戏核心", description = "游戏控制服内部调用：余额查询、下注、取消下注、结算")
public class ProController {

    @Autowired
    private ProService proService;

    @PostMapping("/getBalance")
    @Operation(summary = "查询余额",
            parameters = {
                    @Parameter(name = "username",    description = "用户名", required = true, schema = @Schema(type = "string")),
                    @Parameter(name = "channelId",   description = "渠道ID", required = true, schema = @Schema(type = "integer")),
                    @Parameter(name = "merchantId",  description = "商户ID", required = false, schema = @Schema(type = "string"))
            })
    public JSONObject getBalance(@RequestParam Map<String, String> params) {
        return proService.getBalance(new HashMap<>(params));
    }

    @PostMapping("/bet")
    @Operation(summary = "下注",
            parameters = {
                    @Parameter(name = "username",    description = "用户名", required = true, schema = @Schema(type = "string")),
                    @Parameter(name = "refId",       description = "注单ID（唯一）", required = true, schema = @Schema(type = "string")),
                    @Parameter(name = "channelId",   description = "渠道ID", required = true, schema = @Schema(type = "integer")),
                    @Parameter(name = "gameCode",    description = "游戏代码（可选，兼容 game_code；未传时使用渠道默认值）", required = false, schema = @Schema(type = "string")),
                    @Parameter(name = "merchantId",  description = "商户ID", required = false, schema = @Schema(type = "string")),
                    @Parameter(name = "amount",      description = "下注金额（分）", required = true, schema = @Schema(type = "integer", example = "100000"))
            })
    public JSONObject bet(@RequestParam Map<String, String> params) {
        return proService.bet(new HashMap<>(params));
    }

    @PostMapping("/unbet")
    @Operation(summary = "取消下注",
            parameters = {
                    @Parameter(name = "username",    description = "用户名", required = true, schema = @Schema(type = "string")),
                    @Parameter(name = "refId",       description = "注单ID（唯一）", required = true, schema = @Schema(type = "string")),
                    @Parameter(name = "channelId",   description = "渠道ID", required = true, schema = @Schema(type = "integer")),
                    @Parameter(name = "gameCode",    description = "游戏代码（可选，兼容 game_code；未传时使用渠道默认值）", required = false, schema = @Schema(type = "string")),
                    @Parameter(name = "merchantId",  description = "商户ID", required = false, schema = @Schema(type = "string")),
                    @Parameter(name = "amount",      description = "退款金额（分）", required = false, schema = @Schema(type = "integer", example = "100000"))
            })
    public JSONObject unbet(@RequestParam Map<String, String> params) {
        return proService.unbet(new HashMap<>(params));
    }

    @PostMapping("/settle")
    @Operation(summary = "结算",
            parameters = {
                    @Parameter(name = "username",     description = "用户名", required = true, schema = @Schema(type = "string")),
                    @Parameter(name = "refId",        description = "注单ID（唯一）", required = true, schema = @Schema(type = "string")),
                    @Parameter(name = "channelId",    description = "渠道ID", required = true, schema = @Schema(type = "integer")),
                    @Parameter(name = "gameCode",     description = "游戏代码（可选，兼容 game_code；未传时使用渠道默认值）", required = false, schema = @Schema(type = "string")),
                    @Parameter(name = "merchantId",   description = "商户ID", required = false, schema = @Schema(type = "string")),
                    @Parameter(name = "rewardAmount", description = "派彩金额（分），可为负数", required = true, schema = @Schema(type = "integer", example = "50000"))
            })
    public JSONObject settle(@RequestParam Map<String, String> params) {
        return proService.settle(new HashMap<>(params));
    }
}
