package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.GameRuleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/gameRule")
@Tag(name = "游戏规则", description = "按游戏代码管理全局玩家端规则")
public class GameRuleController {

    @Autowired
    private GameRuleService gameRuleService;

    @PostMapping("/getGameRuleList")
    @Operation(summary = "游戏规则列表")
    public Result<?> getGameRuleList(@RequestBody Map<String, Object> params) {
        return Result.ok(gameRuleService.getGameRuleList(params));
    }

    @PostMapping("/update")
    @Operation(summary = "更新游戏规则")
    public Result<?> update(@RequestBody Map<String, String> params) {
        gameRuleService.updateRule(params.get("gameCode"), params.get("ruleContent"));
        return Result.ok();
    }
}