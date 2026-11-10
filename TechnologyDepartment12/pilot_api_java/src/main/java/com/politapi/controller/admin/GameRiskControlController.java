package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.GameRiskControlService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin")
@Tag(name = "Game Risk Control", description = "Global game risk control by game code")
public class GameRiskControlController {

    @Autowired
    private GameRiskControlService gameRiskControlService;

    @PostMapping("/gameRiskControl/getGameRiskControlList")
    @Operation(summary = "Global game risk control list")
    public Result<?> getGameRiskControlList(@RequestBody Map<String, Object> params) {
        return Result.ok(gameRiskControlService.getGameRiskControlList(params));
    }

    @PostMapping("/gameRiskControl/create")
    @Operation(summary = "Create global game risk control")
    public Result<?> create(@RequestBody Map<String, Object> params) {
        try {
            return Result.ok(gameRiskControlService.create(params));
        } catch (IllegalArgumentException exception) {
            return Result.fail(exception.getMessage());
        }
    }

    @PostMapping("/gameRiskControl/delete")
    @Operation(summary = "Delete global game risk control")
    public Result<?> delete(@RequestBody Map<String, Object> params) {
        try {
            gameRiskControlService.delete(params);
            return Result.ok();
        } catch (IllegalArgumentException exception) {
            return Result.fail(exception.getMessage());
        }
    }

    @PostMapping("/gameRiskControl/update")
    @Operation(summary = "Update global game risk control")
    public Result<?> update(@RequestBody Map<String, Object> params) {
        try {
            gameRiskControlService.update(params);
            return Result.ok();
        } catch (IllegalArgumentException exception) {
            return Result.fail(exception.getMessage());
        }
    }
}