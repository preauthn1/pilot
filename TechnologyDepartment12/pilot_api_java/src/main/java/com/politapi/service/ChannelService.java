package com.politapi.service;

import com.politapi.entity.Channel;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * 渠道服务接口
 */
public interface ChannelService extends IService<Channel> {

    /**
     * 根据 ID 查询渠道（含商户信息）
     */
    Channel getByIdWithMerchant(Long id);

    /**
     * 根据名称查询渠道
     */
    Channel getByName(String name);

    /** 按商户ID查询渠道 */
    Object getChannelBy(Map<String, Object> params);

    /** 分页查询渠道列表 */
    Map<String, Object> getChannelList(Map<String, Object> params);

    /** 创建渠道 */
    Long create(Map<String, String> params);

    /** 更新渠道 */
    void update(Map<String, String> params);

    /** 删除渠道 */
    void deleteChannel(Long id);
}
