package com.politapi.service;

import com.politapi.entity.Task;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * 任务管理服务接口
 */
public interface TaskService extends IService<Task> {
    Map<String, Object> getTaskList(Map<String, Object> params);
    Long create(Map<String, String> params);
    void update(Map<String, String> params);
    Map<String, Object> getTaskUserList(Map<String, Object> params);
    void acceptTask(Map<String, Object> params);
    Map<String, Object> getTaskCapitalList(Map<String, Object> params);
}
