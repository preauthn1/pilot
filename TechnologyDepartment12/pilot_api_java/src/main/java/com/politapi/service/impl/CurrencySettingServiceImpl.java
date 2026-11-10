package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.Channel;
import com.politapi.entity.CurrencySetting;
import com.politapi.mapper.ChannelMapper;
import com.politapi.mapper.CurrencySettingMapper;
import com.politapi.service.CurrencySettingService;
import com.politapi.util.DataScopeHelper;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 币种设置服务实现
 */
@Service
public class CurrencySettingServiceImpl extends ServiceImpl<CurrencySettingMapper, CurrencySetting> implements CurrencySettingService {

    private final ChannelMapper channelMapper;

    public CurrencySettingServiceImpl(ChannelMapper channelMapper) {
        this.channelMapper = channelMapper;
    }

    @Override
    public Map<String, Object> getCurrencyList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1L), 1L);
        long limit = Math.max(toLong(params.get("limit"), 10L), 1L);
        Long channelId = parsePositiveLong(firstPresent(params, "channelId", "channel_id"));
        String currency = normalize(params.get("currency"));
        String tag = normalize(params.get("tag"));

        LambdaQueryWrapper<CurrencySetting> query = new LambdaQueryWrapper<>();
        Set<Long> allowedChannelIds = DataScopeHelper.getAllowedChannelIds();
        if (channelId != null) {
            if (allowedChannelIds != null && !allowedChannelIds.contains(channelId)) {
                query.eq(CurrencySetting::getChannelId, -1L);
            } else {
                query.eq(CurrencySetting::getChannelId, channelId);
            }
        } else if (allowedChannelIds != null) {
            query.in(CurrencySetting::getChannelId, allowedChannelIds);
        }
        if (currency != null) {
            query.like(CurrencySetting::getCurrency, currency);
        }
        if (tag != null) {
            query.like(CurrencySetting::getTag, tag);
        }
        query.orderByDesc(CurrencySetting::getId);

        IPage<CurrencySetting> resultPage = baseMapper.selectPage(Page.of(page, limit), query);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", resultPage.getRecords());
        result.put("total", resultPage.getTotal());
        return result;
    }

    @Override
    public CurrencySetting resolveChannelCurrency(Long channelId, String currencyOrTag) {
        if (channelId == null || channelId <= 0) {
            return null;
        }
        String requestedCurrency = normalize(currencyOrTag);
        LambdaQueryWrapper<CurrencySetting> query = new LambdaQueryWrapper<CurrencySetting>()
                .eq(CurrencySetting::getChannelId, channelId);
        if (requestedCurrency != null) {
            query.and(wrapper -> wrapper
                    .eq(CurrencySetting::getCurrency, requestedCurrency)
                    .or()
                    .eq(CurrencySetting::getTag, requestedCurrency));
        }
        query.orderByAsc(CurrencySetting::getId).last("LIMIT 1");
        return baseMapper.selectOne(query);
    }

    @Override
    public Long create(Map<String, Object> params) {
        Long channelId = requireChannelId(params);
        String currency = normalize(params.get("currency"));
        String tag = normalize(params.get("tag"));
        if (currency == null || tag == null) {
            throw new IllegalArgumentException("参数不完整");
        }

        ensureChannelExistsAndAllowed(channelId);
        ensureUnique(null, channelId, currency, tag);

        CurrencySetting cs = new CurrencySetting();
        cs.setChannelId(channelId);
        cs.setCurrency(currency);
        cs.setTag(tag);
        baseMapper.insert(cs);
        return cs.getId();
    }

    @Override
    public void update(Map<String, Object> params) {
        Long id = parsePositiveLong(params.get("id"));
        if (id == null) {
            throw new IllegalArgumentException("缺少 id");
        }

        CurrencySetting current = baseMapper.selectById(id);
        if (current == null) {
            throw new IllegalArgumentException("币种不存在");
        }
        ensureChannelAllowed(current.getChannelId());

        Long channelId = requireChannelId(params);
        String currency = normalize(params.get("currency"));
        String tag = normalize(params.get("tag"));
        if (currency == null || tag == null) {
            throw new IllegalArgumentException("参数不完整");
        }

        ensureChannelExistsAndAllowed(channelId);
        ensureUnique(id, channelId, currency, tag);

        CurrencySetting cs = new CurrencySetting();
        cs.setId(id);
        cs.setChannelId(channelId);
        cs.setCurrency(currency);
        cs.setTag(tag);
        baseMapper.updateById(cs);
    }

    @Override
    public void deleteCurrency(Long id) {
        if (id == null || id == 0) {
            throw new IllegalArgumentException("缺少 id");
        }
        CurrencySetting current = baseMapper.selectById(id);
        if (current == null) {
            throw new IllegalArgumentException("币种不存在");
        }
        ensureChannelAllowed(current.getChannelId());
        baseMapper.deleteById(id);
    }

    private void ensureUnique(Long currentId, Long channelId, String currency, String tag) {
        CurrencySetting sameCurrency = baseMapper.selectOne(
                new LambdaQueryWrapper<CurrencySetting>()
                        .eq(CurrencySetting::getChannelId, channelId)
                        .eq(CurrencySetting::getCurrency, currency));
        if (sameCurrency != null && !sameCurrency.getId().equals(currentId)) {
            throw new IllegalArgumentException("该渠道币种已存在");
        }

        CurrencySetting sameTag = baseMapper.selectOne(
                new LambdaQueryWrapper<CurrencySetting>()
                        .eq(CurrencySetting::getChannelId, channelId)
                        .eq(CurrencySetting::getTag, tag));
        if (sameTag != null && !sameTag.getId().equals(currentId)) {
            throw new IllegalArgumentException("该渠道符号已存在");
        }
    }

    private Long requireChannelId(Map<String, Object> params) {
        Long channelId = parsePositiveLong(firstPresent(params, "channelId", "channel_id"));
        if (channelId == null) {
            throw new IllegalArgumentException("请选择渠道");
        }
        return channelId;
    }

    private void ensureChannelExistsAndAllowed(Long channelId) {
        ensureChannelAllowed(channelId);
        Channel channel = channelMapper.selectById(channelId);
        if (channel == null) {
            throw new IllegalArgumentException("渠道不存在");
        }
    }

    private void ensureChannelAllowed(Long channelId) {
        Set<Long> allowedChannelIds = DataScopeHelper.getAllowedChannelIds();
        if (allowedChannelIds != null && !allowedChannelIds.contains(channelId)) {
            throw new IllegalArgumentException("无权操作该渠道");
        }
    }

    private Object firstPresent(Map<String, Object> params, String firstKey, String secondKey) {
        Object value = params.get(firstKey);
        return value != null ? value : params.get(secondKey);
    }

    private String normalize(Object value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.toString().trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Long parsePositiveLong(Object value) {
        long parsed = toLong(value, 0L);
        return parsed > 0 ? parsed : null;
    }

    private long toLong(Object value, long defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException exception) {
            return defaultValue;
        }
    }
}
