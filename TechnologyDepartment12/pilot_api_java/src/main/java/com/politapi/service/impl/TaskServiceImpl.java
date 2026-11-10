package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.*;
import com.politapi.mapper.*;
import com.politapi.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 任务管理服务实现
 */
@Service
public class TaskServiceImpl extends ServiceImpl<TaskMapper, Task> implements TaskService {

    @Autowired private TaskUserMapper taskUserMapper;
    @Autowired private TaskCapitalMapper taskCapitalMapper;

    @Override
    public Map<String, Object> getTaskList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);
        IPage<Task> pg = baseMapper.selectPage(Page.of(page, limit),
                new LambdaQueryWrapper<Task>().orderByDesc(Task::getId));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public Long create(Map<String, String> params) {
        Task t = new Task();
        t.setTitle(params.get("title"));
        t.setContent(params.getOrDefault("content", ""));
        t.setMoney(Double.parseDouble(params.getOrDefault("money", "0")));
        t.setNum(Integer.parseInt(params.getOrDefault("num", "1")));
        t.setState(1);
        baseMapper.insert(t);
        return t.getId();
    }

    @Override
    public void update(Map<String, String> params) {
        long id = toLong(params.get("id"), 0);
        Task t = new Task();
        t.setId(id);
        if (params.containsKey("title")) {
            t.setTitle(params.get("title"));
        }
        if (params.containsKey("content")) {
            t.setContent(params.get("content"));
        }
        if (params.containsKey("money")) {
            t.setMoney(Double.parseDouble(params.get("money")));
        }
        if (params.containsKey("num")) {
            t.setNum(Integer.parseInt(params.get("num")));
        }
        if (params.containsKey("state")) {
            t.setState(Integer.parseInt(params.getOrDefault("state", "1")));
        }
        if (params.containsKey("channel")) {
            t.setChannel(Long.parseLong(params.get("channel")));
        }
        if (params.containsKey("system")) {
            t.setSystem(Long.parseLong(params.get("system")));
        }
        if (params.containsKey("requirement")) {
            t.setRequirement(params.get("requirement"));
        }
        if (params.containsKey("remarks")) {
            t.setRemarks(params.get("remarks"));
        }
        baseMapper.updateById(t);
    }

    @Override
    public Map<String, Object> getTaskUserList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);
        IPage<TaskUser> pg = taskUserMapper.selectPage(Page.of(page, limit),
                new LambdaQueryWrapper<TaskUser>().orderByDesc(TaskUser::getId));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public void acceptTask(Map<String, Object> params) {
        Long id = toLong(params.get("id"), 0);
        TaskUser tu = new TaskUser();
        tu.setId(id);
        tu.setState(1);
        taskUserMapper.updateById(tu);
    }

    @Override
    public Map<String, Object> getTaskCapitalList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);
        IPage<TaskCapital> pg = taskCapitalMapper.selectPage(Page.of(page, limit),
                new LambdaQueryWrapper<TaskCapital>().orderByDesc(TaskCapital::getId));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    private long toLong(Object val, long defaultVal) {
        if (val == null) {
            return defaultVal;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        try { return Long.parseLong(val.toString()); } catch (Exception e) { return defaultVal; }
    }
}
