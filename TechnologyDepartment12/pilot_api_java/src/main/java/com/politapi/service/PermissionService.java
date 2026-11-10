package com.politapi.service;

import com.politapi.entity.Permission;

import java.util.Map;

/**
 * 权限管理服务接口
 */
public interface PermissionService {

    /** 分页查询权限列表 */
    Map<String, Object> permissions(Map<String, Object> params);

    /** 查询单个权限 */
    Permission getPermission(Long id);

    /** 创建权限 */
    Long create(Map<String, String> params);

    /** 更新权限 */
    void update(Map<String, String> params);

    /** 删除权限（含子级检查） */
    void delete(Long id);

    /** 权限树 */
    Map<String, Object> permissionsTree(Map<String, Object> params);

    /** 拖拽排序/移动 */
    void drop(Map<String, Object> params);
}
