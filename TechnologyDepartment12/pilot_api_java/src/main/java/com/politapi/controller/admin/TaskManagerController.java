package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 任务管理
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "任务管理", description = "任务 CRUD、领取记录审核、资金记录查询")
public class TaskManagerController {

    @Autowired
    private TaskService taskService;

    @PostMapping("/task/getTaskList")
    @Operation(summary = "任务列表", description = "分页查询任务")
    public Result<?> getTaskList(@RequestBody Map<String, Object> params) {
        return Result.ok(taskService.getTaskList(params));
    }

    @PostMapping("/task/create")
    @Operation(summary = "新增任务")
    public Result<?> create(@RequestBody Map<String, String> params) {
        return Result.ok(taskService.create(params));
    }

    @PostMapping("/task/update")
    @Operation(summary = "更新任务")
    public Result<?> updateTask(@RequestBody Map<String, String> params) {
        taskService.update(params);
        return Result.ok();
    }

    @PostMapping("/taskUser/getTaskUserList")
    @Operation(summary = "任务领取列表", description = "分页查询任务领取记录")
    public Result<?> getTaskUserList(@RequestBody Map<String, Object> params) {
        return Result.ok(taskService.getTaskUserList(params));
    }

    @PostMapping("/taskUser/acceptTask")
    @Operation(summary = "审核通过", description = "审核通过任务领取申请")
    public Result<?> acceptTask(@RequestBody Map<String, Object> params) {
        taskService.acceptTask(params);
        return Result.ok();
    }

    @PostMapping("/taskCapital/getTaskCapitalList")
    @Operation(summary = "任务资金记录", description = "分页查询任务奖励资金记录")
    public Result<?> getTaskCapitalList(@RequestBody Map<String, Object> params) {
        return Result.ok(taskService.getTaskCapitalList(params));
    }
}
