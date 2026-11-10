package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.politapi.entity.Permission;
import com.politapi.mapper.PermissionMapper;
import com.politapi.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 权限管理服务实现
 */
@Service
public class PermissionServiceImpl implements PermissionService {

    @Autowired
    private PermissionMapper permissionMapper;

    @Override
    public Map<String, Object> permissions(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);
        String guardName = (String) params.getOrDefault("guard_name", "admin");

        LambdaQueryWrapper<Permission> qw = new LambdaQueryWrapper<>();
        qw.eq(Permission::getGuardName, guardName);
        String name = (String) params.get("name");
        if (name != null && !name.isEmpty()) {
            qw.like(Permission::getName, name);
        }
        qw.orderByDesc(Permission::getSort);

        IPage<Permission> pg = permissionMapper.selectPage(Page.of(page, limit), qw);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public Permission getPermission(Long id) {
        return permissionMapper.selectById(id);
    }

    @Override
    public Long create(Map<String, String> params) {
        Permission p = mapForm(params, new Permission());
        permissionMapper.insert(p);
        return p.getId();
    }

    @Override
    public void update(Map<String, String> params) {
        Long id = Long.parseLong(params.get("id"));
        Permission p = permissionMapper.selectById(id);
        if (p == null) {
            throw new IllegalArgumentException("权限不存在");
        }
        mapForm(params, p);
        p.setId(id);
        permissionMapper.updateById(p);
    }

    @Override
    public void delete(Long id) {
        if (id == 0) {
            throw new IllegalArgumentException("缺少 id");
        }
        long children = permissionMapper.selectCount(
                new LambdaQueryWrapper<Permission>().eq(Permission::getParentId, id));
        if (children > 0) {
            throw new IllegalArgumentException("请先删除子权限");
        }
        permissionMapper.deleteById(id);
    }

    @Override
    public Map<String, Object> permissionsTree(Map<String, Object> params) {
        String guardName = (String) params.getOrDefault("guard_name", "admin");

        List<Permission> all = permissionMapper.selectList(
                new LambdaQueryWrapper<Permission>()
                        .eq(Permission::getGuardName, guardName)
                        .orderByAsc(Permission::getSort));

        List<Map<String, Object>> flat = new ArrayList<>();
        for (Permission p : all) {
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", p.getId());
            node.put("pid", p.getParentId() != null ? p.getParentId() : 0L);
            node.put("name", p.getName());
            node.put("title", p.getDisplayName());
            node.put("icon", p.getIcon());
            node.put("guardName", p.getGuardName());
            node.put("component", p.getComponent());
            node.put("path", p.getRoute());
            node.put("sort", p.getSort());
            node.put("hidden", p.getHidden());
            node.put("fileName", p.getFileName());
            node.put("noKeepAlive", p.getNoKeepAlive());
            flat.add(node);
        }

        List<Map<String, Object>> tree = buildTree(flat, 0L);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tree", tree);
        return result;
    }

    @Override
    public void drop(Map<String, Object> params) {
        Long draggingId = toLong(params.get("id"), 0);
        Long targetId = toLong(params.get("target_id"), 0);
        String type = (String) params.get("type");

        if (draggingId == 0 || targetId == 0 || type == null) {
            throw new IllegalArgumentException("参数不完整");
        }

        Permission target = permissionMapper.selectById(targetId);
        Permission dragging = permissionMapper.selectById(draggingId);
        if (target == null || dragging == null) {
            throw new IllegalArgumentException("节点不存在");
        }

        switch (type) {
            case "before":
            case "after":
                dragging.setParentId(target.getParentId());
                dragging.setSort(target.getSort() + 1);
                break;
            case "inner":
                dragging.setParentId(target.getId());
                dragging.setSort(1);
                break;
            default:
                throw new IllegalArgumentException("不支持的操作类型: " + type);
        }

        permissionMapper.updateById(dragging);
    }

    // ==================== 工具方法 ====================

    private Permission mapForm(Map<String, String> params, Permission p) {
        if (params.containsKey("name")) {
            p.setName(params.get("name"));
        }
        if (params.containsKey("title")) {
            p.setDisplayName(params.get("title"));
        }
        if (params.containsKey("icon")) {
            p.setIcon(params.get("icon"));
        }
        if (params.containsKey("path")) {
            p.setRoute(params.get("path"));
        }
        if (params.containsKey("component")) {
            p.setComponent(params.get("component"));
        }
        if (params.containsKey("sort")) {
            p.setSort(Integer.parseInt(params.get("sort")));
        }
        if (params.containsKey("hidden")) {
            p.setHidden(Integer.parseInt(params.get("hidden")));
        }
        if (params.containsKey("fileName")) {
            p.setFileName(params.get("fileName"));
        }
        if (params.containsKey("noKeepAlive")) {
            p.setNoKeepAlive(Integer.parseInt(params.get("noKeepAlive")));
        }
        if (params.containsKey("guard_name")) {
            p.setGuardName(params.get("guard_name"));
        }
        if (params.containsKey("pid")) {
            p.setParentId(Long.parseLong(params.get("pid")));
        }
        return p;
    }

    private List<Map<String, Object>> buildTree(List<Map<String, Object>> flat, long pid) {
        List<Map<String, Object>> children = new ArrayList<>();
        for (Map<String, Object> node : flat) {
            long nodePid = ((Number) node.get("pid")).longValue();
            if (nodePid == pid) {
                List<Map<String, Object>> sub = buildTree(flat, ((Number) node.get("id")).longValue());
                if (!sub.isEmpty()) {
                    node.put("children", sub);
                }
                children.add(node);
            }
        }
        return children;
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
