package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.Role;
import com.politapi.mapper.RoleMapper;
import com.politapi.service.RoleService;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 角色服务实现
 */
@Service
public class RoleServiceImpl extends ServiceImpl<RoleMapper, Role> implements RoleService {

    @Override
    public Map<String, Object> roles(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);
        IPage<Role> pg = baseMapper.selectPage(Page.of(page, limit),
                new LambdaQueryWrapper<Role>().orderByDesc(Role::getId));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("roles", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public Role getRole(Long id) {
        return baseMapper.selectById(id);
    }

    @Override
    public Long create(Map<String, String> params) {
        Role r = new Role();
        r.setName(params.get("name"));
        r.setGuardName(params.getOrDefault("description", ""));
        r.setDataScope(Integer.parseInt(params.getOrDefault("dataScope", "0")));
        baseMapper.insert(r);
        return r.getId();
    }

    @Override
    public void update(Map<String, String> params) {
        Long id = Long.parseLong(params.get("id"));
        Role r = new Role();
        r.setId(id);
        r.setName(params.get("name"));
        r.setGuardName(params.getOrDefault("description", ""));
        if (params.containsKey("dataScope")) {
            r.setDataScope(Integer.parseInt(params.get("dataScope")));
        }
        baseMapper.updateById(r);
    }

    @Override
    public void delete(Long id) {
        baseMapper.deleteById(id);
    }

    @Override
    public Object allRoles(Map<String, Object> params) {
        return baseMapper.selectList(null);
    }

    @Override
    public void assignPermissions(Long roleId, String permissionIds) {
        Role r = new Role();
        r.setId(roleId);
        r.setPermissionIds(permissionIds);
        baseMapper.updateById(r);
    }

    @Override
    public String getPermissionIds(Long roleId) {
        Role role = baseMapper.selectById(roleId);
        return role != null ? role.getPermissionIds() : "";
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
