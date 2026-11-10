package com.politapi.service;

import com.politapi.entity.User;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * 用户服务接口
 */
public interface UserService extends IService<User> {

    User getUserInfo(Long channelId, String username);
    User getUserInfoNew(String merchantId, String username);
    boolean createUser(String merchantId, String username, String expand, String ip, String currency, Long channelId);

    /** 分页查询用户列表（联查金币余额） */
    Map<String, Object> getUserList(Map<String, Object> params);

    /** 更新用户状态（启用/禁用） */
    void updateUserStatus(Map<String, Object> params);

    /** 给用户加币 */
    String addCoin(Map<String, Object> params);

    /** 解锁用户（指定 userId 或全部） */
    String openAll(Map<String, Object> params);
}
