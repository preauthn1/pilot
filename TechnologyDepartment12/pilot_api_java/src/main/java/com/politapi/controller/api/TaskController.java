package com.politapi.controller.api;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.common.Result;
import com.politapi.dto.request.TaskAcceptRequest;
import com.politapi.dto.request.TaskQueryRequest;
import com.politapi.entity.*;
import com.politapi.mapper.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 对外开放 - 任务系统接口
 */
@RestController("apiTaskController")
@Tag(name = "任务系统", description = "用户端任务列表、领取、查询接口")
public class TaskController {

    @Autowired private TaskMapper taskMapper;
    @Autowired private TaskUserMapper taskUserMapper;
    @Autowired private TaskCapitalMapper taskCapitalMapper;
    @Autowired private UserMapper userMapper;
    @Autowired private ChannelMapper channelMapper;

    /** 获取任务列表 */
    @GetMapping("/getTaskList")
    @Operation(summary = "任务列表", description = "返回所有启用状态（state=1）的任务")
    public Result<?> getTaskList() {
        List<Task> tasks = taskMapper.selectList(
                new LambdaQueryWrapper<Task>().eq(Task::getState, 1).orderByDesc(Task::getId));
        return Result.ok(tasks);
    }

    /** 查询我的任务 */
    @PostMapping("/myTask")
    @Operation(summary = "我的任务", description = "查询当前用户在指定渠道下已领取/完成的任务列表")
    public Result<?> myTask(@RequestBody TaskQueryRequest req) {
        String username = req.getUsername();
        String channelName = req.getChannel();

        if (username == null) {
            return Result.fail("用户名不能为空");
        }

        Channel channel = null;
        if (channelName != null && !channelName.isEmpty()) {
            channel = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channelName));
            if (channel == null) {
                return Result.fail("渠道不存在");
            }
        }

        LambdaQueryWrapper<TaskUser> qw = new LambdaQueryWrapper<>();
        qw.eq(TaskUser::getUsername, username);
        if (channel != null) {
            qw.eq(TaskUser::getChannel, channel.getId());
        }
        qw.orderByDesc(TaskUser::getId);

        return Result.ok(taskUserMapper.selectList(qw));
    }

    /** 领取任务 */
    @PostMapping("/getTaskUserCreate")
    @Operation(summary = "领取任务", description = "用户领取任务。每人每任务仅可领取一次，重复领取会返回错误。")
    public Result<?> acceptTask(@RequestBody TaskAcceptRequest req) {
        Long taskId = req.getTaskId();
        String username = req.getUsername();
        Long channelId = req.getChannel() != null ? req.getChannel() : 0L;

        if (taskId == null || taskId == 0 || username == null) {
            return Result.fail("参数不完整");
        }

        Task task = taskMapper.selectById(taskId);
        if (task == null || task.getState() != 1) {
            return Result.fail("任务不存在或已关闭");
        }

        TaskUser exist = taskUserMapper.selectOne(new LambdaQueryWrapper<TaskUser>()
                .eq(TaskUser::getTaskId, taskId).eq(TaskUser::getUsername, username));
        if (exist != null) {
            return Result.fail("已领取过该任务");
        }

        TaskUser tu = new TaskUser();
        tu.setTaskId(taskId);
        tu.setUsername(username);
        tu.setChannel(channelId);
        tu.setMoney(task.getMoney());
        tu.setState(0);
        taskUserMapper.insert(tu);
        return Result.ok(tu.getId());
    }

    /** 查询任务资金记录 */
    @PostMapping("/myTaskCapital")
    @Operation(summary = "任务资金记录", description = "查询当前用户的任务奖励资金记录")
    public Result<?> myTaskCapital(@RequestBody TaskQueryRequest req) {
        String username = req.getUsername();
        String channelName = req.getChannel();

        if (username == null) {
            return Result.fail("用户名不能为空");
        }

        LambdaQueryWrapper<TaskCapital> qw = new LambdaQueryWrapper<>();
        qw.eq(TaskCapital::getUsername, username);
        qw.orderByDesc(TaskCapital::getId);

        return Result.ok(taskCapitalMapper.selectList(qw));
    }
}
