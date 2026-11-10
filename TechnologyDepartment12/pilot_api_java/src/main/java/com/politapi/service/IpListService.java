package com.politapi.service;

import com.politapi.entity.IpList;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * IP白名单服务接口
 */
public interface IpListService extends IService<IpList> {
    Map<String, Object> getIpList(Map<String, Object> params);
    Long create(Map<String, String> params);
    void update(Map<String, String> params);
    void delete(Long id);

    /**
     * 检查指定 IP 是否在白名单中
     *
     * @param ip       客户端 IP
     * @param pathType 路径类型：admin 查 admin_status，api 查 api_status
     * @return true 允许访问，false 拒绝
     */
    boolean isIpAllowed(String ip, String pathType);
}
