package com.politapi.context;

import com.politapi.entity.Admin;

/**
 * 当前请求的管理员上下文（ThreadLocal）。
 * 在 JwtInterceptor 中设置，在 afterCompletion 中清除。
 */
public class AdminContext {

    private static final ThreadLocal<Admin> CURRENT_ADMIN = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> FULL_DATA_SCOPE = new ThreadLocal<>();

    public static void set(Admin admin) {
        CURRENT_ADMIN.set(admin);
    }

    public static Admin get() {
        return CURRENT_ADMIN.get();
    }

    /** 设置当前管理员是否拥有全数据权限（来自角色 data_scope） */
    public static void setFullDataScope(boolean full) {
        FULL_DATA_SCOPE.set(full);
    }

    /** 当前管理员是否拥有全数据权限 */
    public static boolean isFullDataScope() {
        Boolean v = FULL_DATA_SCOPE.get();
        return v != null && v;
    }

    public static void clear() {
        CURRENT_ADMIN.remove();
        FULL_DATA_SCOPE.remove();
    }
}
