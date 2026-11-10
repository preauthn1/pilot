package com.politapi.service;

import com.politapi.entity.Admin;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;
import java.util.Map;

/**
 * 管理员服务接口
 */
public interface AdminService extends IService<Admin> {

    /**
     * 管理员登录验证
     */
    Admin login(String name, String password);

    /**
     * 生成 JWT Token
     */
    String generateToken(Admin admin);

    /** 分页查询管理员列表 */
    Map<String, Object> admins(Map<String, Object> params);

    /** 查询单个管理员详情 */
    Admin getAdmin(Long id);

    /** 创建管理员 */
    Long createAdmin(Map<String, String> params);

    /** 更新管理员 */
    void updateAdmin(Map<String, String> params);

    /** 删除管理员 */
    void deleteAdmin(Long id);

    /** 修改当前管理员密码 */
    void updatePassword(Long adminId, String password);

    /** 重置当前管理员密码 */
    void resetPassword(Long adminId);

    /** 获取当前登录管理员信息（名称、菜单路由、权限） */
    Map<String, Object> me(Long adminId);

    /**
     * 获取管理员的权限ID列表（字符串形式，用于 Vben Admin 权限码接口）
     */
    List<String> getPermIdsAsString(Long adminId);
}
