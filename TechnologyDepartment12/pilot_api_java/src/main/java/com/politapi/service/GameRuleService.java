package com.politapi.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.politapi.entity.GameRule;

import java.util.Map;

public interface GameRuleService extends IService<GameRule> {

    Map<String, Object> getGameRuleList(Map<String, Object> params);

    void updateRule(String gameCode, String ruleContent);

    String getRuleContent(String gameCode);
}