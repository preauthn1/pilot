package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.GameRule;
import com.politapi.mapper.GameRuleMapper;
import com.politapi.service.GameRuleService;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class GameRuleServiceImpl extends ServiceImpl<GameRuleMapper, GameRule> implements GameRuleService {

    @Override
    public Map<String, Object> getGameRuleList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = Math.max(toLong(params.get("limit"), 10), 1);
        IPage<GameRule> gameRulePage = baseMapper.selectPage(
                Page.of(page, limit),
                new LambdaQueryWrapper<GameRule>().orderByAsc(GameRule::getGameCode));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", gameRulePage.getRecords());
        result.put("total", gameRulePage.getTotal());
        return result;
    }

    @Override
    public void updateRule(String gameCode, String ruleContent) {
        String normalizedGameCode = normalizeGameCode(gameCode);
        if (normalizedGameCode.isEmpty()) {
            throw new IllegalArgumentException("gameCode 不能为空");
        }
        GameRule existingRule = baseMapper.selectOne(
                new LambdaQueryWrapper<GameRule>().eq(GameRule::getGameCode, normalizedGameCode));
        if (existingRule == null) {
            GameRule newRule = new GameRule();
            newRule.setGameCode(normalizedGameCode);
            newRule.setRuleContent(ruleContent == null ? "" : ruleContent);
            baseMapper.insert(newRule);
            return;
        }
        existingRule.setGameCode(normalizedGameCode);
        existingRule.setRuleContent(ruleContent == null ? "" : ruleContent);
        baseMapper.updateById(existingRule);
    }

    @Override
    public String getRuleContent(String gameCode) {
        String normalizedGameCode = normalizeGameCode(gameCode);
        if (normalizedGameCode.isEmpty()) {
            return "";
        }
        GameRule gameRule = baseMapper.selectOne(
                new LambdaQueryWrapper<GameRule>().eq(GameRule::getGameCode, normalizedGameCode));
        return gameRule == null || gameRule.getRuleContent() == null ? "" : gameRule.getRuleContent();
    }

    private String normalizeGameCode(String gameCode) {
        return gameCode == null ? "" : gameCode.trim().toLowerCase(Locale.ROOT);
    }

    private long toLong(Object value, long defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException exception) {
            return defaultValue;
        }
    }
}