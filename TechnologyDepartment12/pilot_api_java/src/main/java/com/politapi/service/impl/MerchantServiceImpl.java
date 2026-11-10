package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.Merchant;
import com.politapi.mapper.MerchantMapper;
import com.politapi.service.MerchantService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 商户服务实现
 */
@Service
public class MerchantServiceImpl extends ServiceImpl<MerchantMapper, Merchant> implements MerchantService {

    @Cacheable(value = "merchant", key = "#username", unless = "#result == null")
    public Merchant getByUsername(String username) {
        return baseMapper.selectOne(new LambdaQueryWrapper<Merchant>().eq(Merchant::getUsername, username));
    }

    @Cacheable(value = "merchant", key = "#id", unless = "#result == null")
    public Merchant getById(Long id) {
        return baseMapper.selectById(id);
    }

    @Override
    public Map<String, Object> getMerchantList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);
        String username = (String) params.get("username");

        LambdaQueryWrapper<Merchant> qw = new LambdaQueryWrapper<>();
        if (username != null && !username.isEmpty()) {
            qw.eq(Merchant::getUsername, username);
        }
        qw.orderByDesc(Merchant::getId);
        IPage<Merchant> pg = baseMapper.selectPage(Page.of(page, limit), qw);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", pg.getRecords());
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public Long create(Map<String, String> params) {
        String username = params.get("username");
        String secret = params.get("secret");
        if (username == null || secret == null) {
            throw new IllegalArgumentException("参数不完整");
        }

        Merchant exist = baseMapper.selectOne(new LambdaQueryWrapper<Merchant>().eq(Merchant::getUsername, username));
        if (exist != null) {
            throw new IllegalArgumentException("商户名称已存在");
        }

        Merchant m = new Merchant();
        m.setUsername(username);
        m.setSecret(secret);
        String walletType = params.get("walletType");
        m.setWalletType(walletType != null ? parseWalletType(walletType) : 2);
        m.setReturnUrl(params.getOrDefault("returnUrl", ""));
        baseMapper.insert(m);
        return m.getId();
    }

    @Override
    public void update(Map<String, String> params) {
        Merchant m = new Merchant();
        Long id = Long.parseLong(params.get("id"));
        m.setId(id);
        String username = params.get("username");
        if (username != null) {
            m.setUsername(username);
        }
        String walletType = params.get("walletType");
        if (walletType != null) {
            m.setWalletType(parseWalletType(walletType));
        }
        String returnUrl = params.get("returnUrl");
        if (returnUrl != null) {
            m.setReturnUrl(returnUrl);
        }
        String secret = params.get("secret");
        if (secret != null) {
            m.setSecret(secret);
        }
        baseMapper.updateById(m);
    }

    @Override
    public void delete(Long id) {
        if (id == 0) {
            throw new IllegalArgumentException("缺少 id");
        }
        baseMapper.deleteById(id);
    }

    private long toLong(Object val, long defaultVal) {
        if (val == null) {
            return defaultVal;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        try { return Long.parseLong(val.toString()); } catch (Exception e) { return defaultVal; }
    }

    private int parseWalletType(String walletType) {
        try {
            int value = Integer.parseInt(walletType);
            if (value == 1 || value == 2) {
                return value;
            }
        } catch (NumberFormatException ignored) {
        }
        throw new IllegalArgumentException("钱包类型不支持");
    }
}
