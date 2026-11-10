package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.Admin;
import com.politapi.entity.Permission;
import com.politapi.entity.Role;
import com.politapi.mapper.AdminMapper;
import com.politapi.mapper.PermissionMapper;
import com.politapi.mapper.RoleMapper;
import com.politapi.service.AdminService;
import com.politapi.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 管理员服务实现
 */
@Service
public class AdminServiceImpl extends ServiceImpl<AdminMapper, Admin> implements AdminService {

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder();

    @Autowired
    private RoleMapper roleMapper;
    @Autowired
    private PermissionMapper permissionMapper;

    @Override
    public Admin login(String name, String password) {
        Admin admin = baseMapper.selectOne(new LambdaQueryWrapper<Admin>().eq(Admin::getName, name));
        if (admin == null || admin.getStatus() == 2) {
            return null;
        }
        if (!ENCODER.matches(password, admin.getPassword())) {
            return null;
        }
        return admin;
    }

    @Override
    public String generateToken(Admin admin) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "admin");
        return JwtUtil.generateToken(admin.getId(), claims);
    }

    @Override
    public Map<String, Object> admins(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);

        LambdaQueryWrapper<Admin> qw = new LambdaQueryWrapper<>();
        String name = (String) params.get("name");
        if (name != null && !name.isEmpty()) {
            qw.like(Admin::getName, name);
        }
        Object status = params.get("status");
        if (status != null) {
            qw.eq(Admin::getStatus, Integer.parseInt(status.toString()));
        }
        Object merchantId = params.get("merchant_id");
        if (merchantId != null && !merchantId.toString().isEmpty()) {
            qw.eq(Admin::getMerchantId, merchantId.toString());
        }
        Object roleId = params.get("roleId");
        if (roleId != null && !roleId.toString().isEmpty()) {
            qw.eq(Admin::getRoleId, Integer.parseInt(roleId.toString()));
        }
        Object platformId = params.get("platform_id");
        if (platformId != null && !platformId.toString().isEmpty()) {
            qw.eq(Admin::getPlatformId, platformId.toString());
        }
        String sort = (String) params.get("sort");
        if ("id".equals(sort) || sort == null) {
            qw.orderByDesc(Admin::getId);
        }
        else qw.orderByDesc(Admin::getCreatedAt);

        IPage<Admin> pg = baseMapper.selectPage(Page.of(page, limit), qw);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public Admin getAdmin(Long id) {
        return baseMapper.selectById(id);
    }

    @Override
    public Long createAdmin(Map<String, String> params) {
        String name = params.get("name");
        String password = params.get("password");
        if (name == null || password == null) {
            throw new IllegalArgumentException("参数不完整");
        }

        Admin exist = baseMapper.selectOne(new LambdaQueryWrapper<Admin>().eq(Admin::getName, name));
        if (exist != null) {
            throw new IllegalArgumentException("管理员已存在");
        }

        Admin a = new Admin();
        a.setName(name);
        a.setPassword(ENCODER.encode(password));
        a.setRoleId(Integer.parseInt(params.getOrDefault("roleId", "0")));
        a.setStatus(1);
        a.setAdminType(Integer.parseInt(params.getOrDefault("adminType", "0")));
        a.setMerchantId(params.getOrDefault("merchantId", "0"));
        a.setChannelId(params.getOrDefault("channelId", "0"));
        a.setPlatformId(params.getOrDefault("platformId", "0"));
        a.setIsPackage(Integer.parseInt(params.getOrDefault("isPackage", "0")));
        if (params.containsKey("packageIds")) {
            a.setPackageIds(params.get("packageIds"));
        }
        if (params.containsKey("optPwd")) {
            a.setOptPwd(params.get("optPwd"));
        }
        baseMapper.insert(a);
        return a.getId();
    }

    @Override
    public void updateAdmin(Map<String, String> params) {
        Long id = Long.parseLong(params.get("id"));
        Admin a = new Admin();
        a.setId(id);
        String name = params.get("name");
        if (name != null) {
            a.setName(name);
        }
        String roleId = params.get("roleId");
        if (roleId != null) {
            a.setRoleId(Integer.parseInt(roleId));
        }
        String status = params.get("status");
        if (status != null) {
            a.setStatus(Integer.parseInt(status));
        }
        String merchantId = params.get("merchantId");
        if (merchantId != null) {
            a.setMerchantId(merchantId);
        }
        String adminType = params.get("adminType");
        if (adminType != null) {
            a.setAdminType(Integer.parseInt(adminType));
        }
        String channelId = params.get("channelId");
        if (channelId != null) {
            a.setChannelId(channelId);
        }
        String platformId = params.get("platformId");
        if (platformId != null) {
            a.setPlatformId(platformId);
        }
        String isPackage = params.get("isPackage");
        if (isPackage != null) {
            a.setIsPackage(Integer.parseInt(isPackage));
        }
        String packageIds = params.get("packageIds");
        if (packageIds != null) {
            a.setPackageIds(packageIds);
        }
        String optPwd = params.get("optPwd");
        if (optPwd != null) {
            a.setOptPwd(optPwd);
        }
        String password = params.get("password");
        if (password != null && !password.trim().isEmpty()) {
            a.setPassword(ENCODER.encode(password));
        }
        baseMapper.updateById(a);
    }

    @Override
    public void deleteAdmin(Long id) {
        baseMapper.deleteById(id);
    }

    @Override
    public void updatePassword(Long adminId, String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("密码不能为空");
        }
        Admin a = new Admin();
        a.setId(adminId);
        a.setPassword(ENCODER.encode(password));
        baseMapper.updateById(a);
    }

    @Override
    public void resetPassword(Long adminId) {
        Admin a = new Admin();
        a.setId(adminId);
        a.setPassword(ENCODER.encode("123456"));
        baseMapper.updateById(a);
    }

    @Override
    public Map<String, Object> me(Long adminId) {
        Admin admin = baseMapper.selectById(adminId);
        if (admin == null) {
            throw new IllegalArgumentException("admin not found");
        }

        Map<String, Object> info = new HashMap<>();
        info.put("name", admin.getName());
        info.put("roleId", admin.getRoleId() != null ? admin.getRoleId().toString() : "0");
        info.put("platformId", admin.getMerchantId() != null ? admin.getMerchantId() : "0");
        info.put("isPackage", admin.getIsPackage() != null ? admin.getIsPackage() : 0);
        info.put("packageIds", admin.getPackageIds() != null ? admin.getPackageIds() : "");
        info.put("accessedRoutes", buildMenuRoutes(admin));
        return info;
    }

    // ==================== 路由构建 ====================

    private List<Map<String, Object>> buildMenuRoutes(Admin admin) {
        List<Long> permIds = getPermIds(admin);
        if (permIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Permission> all = getMenuPermissions(permIds);

        all.sort(Comparator.comparingInt(p -> p.getSort() == null ? 0 : p.getSort()));

        List<Map<String, Object>> flat = new ArrayList<>();
        for (Permission p : all) {
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", p.getId());
            node.put("pid", p.getParentId() != null ? p.getParentId() : 0L);
            node.put("path", p.getRoute() != null ? p.getRoute() : "");
            node.put("component", p.getComponent() != null ? p.getComponent() : "layout/Layout");
            String routeName = (p.getFileName() != null && !p.getFileName().isEmpty())
                    ? p.getFileName() : p.getName();
            node.put("name", routeName);
            node.put("meta", buildMeta(p));
            node.put("hidden", p.getHidden() != null && p.getHidden() == 1);
            node.put("sort", p.getSort() != null ? p.getSort() : 0);
            flat.add(node);
        }

        List<Map<String, Object>> tree = buildTree(flat, 0L);
        return wrapLayout(tree);
    }

    private List<Long> getPermIds(Admin admin) {
        Integer roleId = admin.getRoleId();
        if (roleId == null || roleId == 0) {
            return permissionMapper.selectList(null).stream()
                    .map(Permission::getId).toList();
        }
        Role role = roleMapper.selectById(roleId);
        if (role == null || role.getPermissionIds() == null || role.getPermissionIds().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(role.getPermissionIds().split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .map(Long::parseLong).toList();
    }

    private List<Permission> getMenuPermissions(List<Long> permIds) {
        List<Permission> permissions = permissionMapper.selectList(null);
        Map<Long, Permission> permissionsById = new HashMap<>();
        for (Permission permission : permissions) {
            permissionsById.put(permission.getId(), permission);
        }

        Set<Long> menuPermissionIds = new HashSet<>(permIds);
        for (Long permissionId : permIds) {
            Permission permission = permissionsById.get(permissionId);
            while (permission != null
                    && permission.getParentId() != null
                    && permission.getParentId() != 0) {
                Long parentId = permission.getParentId();
                if (!menuPermissionIds.add(parentId)) {
                    break;
                }
                permission = permissionsById.get(parentId);
            }
        }

        return new ArrayList<>(permissions.stream()
                .filter(permission -> menuPermissionIds.contains(permission.getId()))
                .toList());
    }

    private Map<String, Object> buildMeta(Permission p) {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("title", p.getDisplayName());
        meta.put("icon", p.getIcon() != null ? p.getIcon() : "");
        meta.put("noKeepAlive", p.getNoKeepAlive() != null && p.getNoKeepAlive() == 1);
        return meta;
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

    private List<Map<String, Object>> wrapLayout(List<Map<String, Object>> nodes) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> node : nodes) {
            long pid = ((Number) node.get("pid")).longValue();
            String comp = (String) node.get("component");
            boolean hidden = (boolean) node.getOrDefault("hidden", false);

            if (pid == 0 && !"layout/Layout".equals(comp) && !hidden) {
                Map<String, Object> layout = new LinkedHashMap<>();
                layout.put("path", node.get("path"));
                layout.put("component", "layout/Layout");
                layout.put("redirect", "noRedirect");
                Map<String, Object> layoutMeta = new LinkedHashMap<>();
                layoutMeta.put("title", ((Map<String, Object>) node.get("meta")).get("title"));
                layoutMeta.put("icon", ((Map<String, Object>) node.get("meta")).get("icon"));
                layoutMeta.put("breadcrumb", false);
                layout.put("meta", layoutMeta);

                Map<String, Object> child = new LinkedHashMap<>();
                child.put("path", "index");
                child.put("component", comp);
                child.put("name", node.get("name"));
                child.put("hidden", hidden);
                child.put("meta", node.get("meta"));
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> grandChildren = (List<Map<String, Object>>) node.get("children");
                if (grandChildren != null) {
                    child.put("children", grandChildren);
                }

                layout.put("children", List.of(child));
                result.add(layout);
            } else {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> subChildren = (List<Map<String, Object>>) node.get("children");
                if (subChildren != null) {
                    node.put("children", wrapLayout(subChildren));
                }
                result.add(node);
            }
        }
        Map<String, Object> star = new HashMap<>();
        star.put("path", "*");
        star.put("redirect", "/404");
        star.put("hidden", true);
        result.add(star);
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

    @Override
    public List<String> getPermIdsAsString(Long adminId) {
        Admin admin = baseMapper.selectById(adminId);
        if (admin == null) {
            return Collections.emptyList();
        }
        return getPermIds(admin).stream().map(String::valueOf).collect(Collectors.toList());
    }
}
