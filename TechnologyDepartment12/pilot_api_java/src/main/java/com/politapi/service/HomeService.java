package com.politapi.service;

import java.util.Map;

/**
 * 首页仪表盘服务接口
 */
public interface HomeService {

    /**
     * 获取首页仪表盘数据（按币种分组统计今日/全量投注、派彩、盈亏、人数）
     * 返回 {recharge, prize, winLost, BetsNums}
     */
    Map<String, Object> getHomeList();
}
