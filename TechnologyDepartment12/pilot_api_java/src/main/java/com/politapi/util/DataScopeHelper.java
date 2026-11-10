package com.politapi.util;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.politapi.context.AdminContext;
import com.politapi.entity.Admin;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * 数据范围工具 — 根据当前管理员的角色和 package_ids 决定渠道可见范围。
 * <p>
 * 规则（优先级从高到低）：
 * <ol>
 *   <li>角色 data_scope=1 → 全部数据（null）</li>
 *   <li>package_ids 有值 → 解析为渠道 ID 集合</li>
 *   <li>package_ids 为空，channel_id 有有效值 → 回退用 channel_id 作为唯一渠道</li>
 *   <li>都没有 → 哨兵值 -1（看不到任何数据）</li>
 * </ol>
 */
public class DataScopeHelper {

    /** 哨兵值：当管理员未配置任何渠道时，用 -1 确保 IN 子句合法但匹配不到任何记录 */
    private static final Set<Long> EMPTY_SCOPE = Collections.singleton(-1L);

    /**
     * 获取当前管理员允许查看的渠道 ID 集合。
     * @return null 表示不限制，包含 -1L 的集合表示无权限，非空集合为允许的渠道 ID
     */
    public static Set<Long> getAllowedChannelIds() {
        Admin admin = AdminContext.get();
        if (admin == null) {
            return null;
        }
        if (AdminContext.isFullDataScope()) {
            return null;
        }
        // 优先用 package_ids
        String pkg = admin.getPackageIds();
        if (pkg != null && !pkg.isEmpty()) {
            Set<Long> ids = parseChannelIds(pkg);
            return ids.isEmpty() ? EMPTY_SCOPE : ids;
        }
        // 回退：package_ids 为空但有关联渠道 → 用关联渠道作为唯一可管渠道
        Long chId = parseSingleChannelId(admin.getChannelId());
        if (chId != null) {
            return Collections.singleton(chId);
        }
        return EMPTY_SCOPE;
    }

    /** 解析单个 channelId 字符串，返回 null 表示无效（0、空、非数字） */
    private static Long parseSingleChannelId(String channelId) {
        if (channelId == null || channelId.isEmpty() || "0".equals(channelId)) {
            return null;
        }
        try {
            long id = Long.parseLong(channelId.trim());
            return id > 0 ? id : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 解析 package_ids 字符串为 Long 集合。
     * 支持两种格式：JSON 数组 "[10006,10008]" 和逗号分隔 "10006,10008"。
     */
    private static Set<Long> parseChannelIds(String pkg) {
        Set<Long> ids = new HashSet<>();
        String trimmed = pkg.trim();
        if (trimmed.startsWith("[")) {
            try {
                JSONArray arr = JSON.parseArray(trimmed);
                for (Object item : arr) {
                    ids.add(((Number) item).longValue());
                }
            } catch (Exception e) {
                return Collections.emptySet();
            }
        } else {
            for (String part : trimmed.split(",")) {
                String s = part.trim();
                if (!s.isEmpty()) {
                    try {
                        ids.add(Long.parseLong(s));
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        return ids;
    }
}
