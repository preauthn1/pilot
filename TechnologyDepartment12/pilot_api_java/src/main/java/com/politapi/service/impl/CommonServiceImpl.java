package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.politapi.entity.*;
import com.politapi.mapper.*;
import com.politapi.service.CommonService;
import com.politapi.util.DataScopeHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 通用接口服务实现
 */
@Service
public class CommonServiceImpl implements CommonService {

    @Autowired private AdminMapper adminMapper;
    @Autowired private RoleMapper roleMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private ChannelMapper channelMapper;
    @Autowired private SystemConfigMapper systemConfigMapper;
    @Autowired private CurrencySettingMapper currencySettingMapper;

    @Override
    public Map<String, Object> dictMaps(Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<String> dictNames = (List<String>) params.get("dict_names");
        if (dictNames == null || dictNames.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        for (String name : dictNames) {
            try {
                switch (name) {
                    case "adminInfo" -> result.put("adminInfo", adminMap());
                    case "roleList" -> result.put("roleList", roleMap());
                    case "merchantList" -> result.put("merchantList", merchantMap());
                    case "merchantWalletTypeMap" -> result.put("merchantWalletTypeMap", merchantWalletTypeMap());
                    case "getChannelList" -> result.put("getChannelList", channelMap());
                    case "getExpand" -> result.put("getExpand", expandConfig());
                    case "getSystem" -> result.put("getSystem", systemMap());
                    case "currencyList" -> result.put("currencyList", currencyMap(params));
                    case "walletTypeList" -> result.put("walletTypeList", walletTypeMap());
                }
            } catch (Exception e) {
                e.printStackTrace();
                result.put(name, Collections.emptyMap());
            }
        }
        return result;
    }

    private Map<String, String> adminMap() {
        return adminMapper.selectList(null).stream()
                .collect(Collectors.toMap(a -> String.valueOf(a.getId()), Admin::getName, (v1, v2) -> v1, LinkedHashMap::new));
    }

    private Map<String, String> roleMap() {
        return roleMapper.selectList(null).stream()
                .collect(Collectors.toMap(r -> String.valueOf(r.getId()), Role::getName, (v1, v2) -> v1, LinkedHashMap::new));
    }

    private Map<String, String> merchantMap() {
        return merchantMapper.selectList(null).stream()
                .collect(Collectors.toMap(m -> String.valueOf(m.getId()), Merchant::getUsername, (v1, v2) -> v1, LinkedHashMap::new));
    }

    private Map<String, Integer> merchantWalletTypeMap() {
        return merchantMapper.selectList(null).stream()
                .collect(Collectors.toMap(
                        m -> String.valueOf(m.getId()),
                        m -> Optional.ofNullable(m.getWalletType()).orElse(0),
                        (v1, v2) -> v1,
                        LinkedHashMap::new));
    }

    private Map<String, String> channelMap() {
        LambdaQueryWrapper<Channel> query = new LambdaQueryWrapper<>();
        Set<Long> allowedChannelIds = DataScopeHelper.getAllowedChannelIds();
        if (allowedChannelIds != null) {
            query.in(Channel::getId, allowedChannelIds);
        }
        return channelMapper.selectList(query).stream()
                .collect(Collectors.toMap(c -> String.valueOf(c.getId()), Channel::getName, (v1, v2) -> v1, LinkedHashMap::new));
    }

    private Map<String, String> systemMap() {
        return systemConfigMapper.selectList(null).stream()
                .collect(Collectors.toMap(s -> String.valueOf(s.getId()), SystemConfig::getCfgKey, (v1, v2) -> v1, LinkedHashMap::new));
    }

    private Map<String, String> currencyMap(Map<String, Object> params) {
        LambdaQueryWrapper<CurrencySetting> query = new LambdaQueryWrapper<>();
        Set<Long> allowedChannelIds = DataScopeHelper.getAllowedChannelIds();
        Long channelId = toPositiveLong(params.get("channelId"));
        if (channelId == null) {
            channelId = toPositiveLong(params.get("channel_id"));
        }
        if (channelId != null) {
            if (allowedChannelIds != null && !allowedChannelIds.contains(channelId)) {
                return Collections.emptyMap();
            }
            query.eq(CurrencySetting::getChannelId, channelId);
        } else if (allowedChannelIds != null) {
            query.in(CurrencySetting::getChannelId, allowedChannelIds);
        }
        return currencySettingMapper.selectList(query).stream()
                .map(CurrencySetting::getTag)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .distinct()
                .collect(Collectors.toMap(tag -> tag, tag -> tag, (v1, v2) -> v1, LinkedHashMap::new));
    }

    private Long toPositiveLong(Object value) {
        if (value == null) {
            return null;
        }
        try {
            long parsed = Long.parseLong(value.toString());
            return parsed > 0 ? parsed : null;
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Map<String, String> walletTypeMap() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("1", "共享钱包");
        map.put("2", "转账钱包");
        return map;
    }

    private Object expandConfig() {
        try {
            SystemConfig config = systemConfigMapper.selectOne(
                    new LambdaQueryWrapper<SystemConfig>().eq(SystemConfig::getCfgKey, "expand"));
            return config != null ? config.getCfgValue() : "";
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }
}
