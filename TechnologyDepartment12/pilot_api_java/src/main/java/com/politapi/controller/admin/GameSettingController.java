package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.entity.GameSetting;
import com.politapi.service.GameSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 游戏设置
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "游戏设置", description = "管理游戏规则、投注范围、结算倍数等")
public class GameSettingController {

    @Autowired
    private GameSettingService gameSettingService;

    /**
     * 分页查询游戏设置列表
     */
    @PostMapping("/gameSetting/getGameList")
    @Operation(summary = "游戏设置列表", description = "分页查询游戏设置")
    public Result<?> getGameList(@RequestBody Map<String, Object> params) {
        return Result.ok(gameSettingService.getGameList(params));
    }

    /**
     * 更新游戏设置
     */
    @PostMapping("/gameSetting/update")
    @Operation(summary = "更新游戏设置")
    public Result<?> update(@RequestBody GameSetting gameSetting) {
        gameSettingService.update(gameSetting);
        return Result.ok();
    }

    /**
     * 新增游戏设置
     */
    @PostMapping("/gameSetting/add")
    @Operation(summary = "新增游戏设置")
    public Result<?> add(@RequestBody GameSetting gameSetting) {
        return Result.ok(gameSettingService.add(gameSetting));
    }

    /**
     * 更新游戏维护状态（预留）
     */
    @PostMapping("/gameSetting/updateMaintain")
    @Operation(summary = "更新维护状态（预留）")
    public Result<?> updateMaintain(@RequestBody Map<String, String> params) {
        return Result.ok();
    }
}
