package com.politapi.service;

import com.politapi.entity.CurrencySetting;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * 币种设置服务接口
 */
public interface CurrencySettingService extends IService<CurrencySetting> {
    Map<String, Object> getCurrencyList(Map<String, Object> params);
    CurrencySetting resolveChannelCurrency(Long channelId, String currencyOrTag);
    Long create(Map<String, Object> params);
    void update(Map<String, Object> params);
    void deleteCurrency(Long id);
}
