package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.entity.RobotSetting;
import com.politapi.service.RobotSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 机器人配置
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "机器人配置", description = "机器人行为参数 CRUD")
public class RobotSettingController {

    @Autowired
    private RobotSettingService robotSettingService;

    @PostMapping("/robotSetting/getRobotList")
    @Operation(summary = "机器人列表", description = "分页查询机器人配置")
    public Result<?> getRobotList(@RequestBody Map<String, Object> params) {
        return Result.ok(robotSettingService.getRobotList(params));
    }

    @PostMapping("/robotSetting/add")
    @Operation(summary = "新增机器人")
    public Result<?> add(@RequestBody RobotSetting robotSetting) {
        return Result.ok(robotSettingService.add(robotSetting));
    }

    @PostMapping("/robotSetting/update")
    @Operation(summary = "更新机器人")
    public Result<?> update(@RequestBody RobotSetting robotSetting) {
        robotSettingService.update(robotSetting);
        return Result.ok();
    }
}
