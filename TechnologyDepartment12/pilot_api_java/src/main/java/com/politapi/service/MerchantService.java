package com.politapi.service;

import com.politapi.entity.Merchant;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * 商户服务接口
 */
public interface MerchantService extends IService<Merchant> {

    /** 分页查询商户列表 */
    Map<String, Object> getMerchantList(Map<String, Object> params);

    /** 创建商户 */
    Long create(Map<String, String> params);

    /** 更新商户 */
    void update(Map<String, String> params);

    /** 删除商户 */
    void delete(Long id);

}
