package com.politapi.service;

import com.politapi.entity.Role;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * 角色服务接口
 */
public interface RoleService extends IService<Role> {
    Map<String, Object> roles(Map<String, Object> params);
    Role getRole(Long id);
    Long create(Map<String, String> params);
    void update(Map<String, String> params);
    void delete(Long id);
    Object allRoles(Map<String, Object> params);
    void assignPermissions(Long roleId, String permissionIds);
    String getPermissionIds(Long roleId);
}
