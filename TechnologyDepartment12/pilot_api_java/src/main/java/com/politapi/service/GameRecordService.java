package com.politapi.service;

import com.politapi.entity.GameRecord;

import java.util.Map;

/**
 * 游戏结算记录服务接口
 */
public interface GameRecordService {

    /** 分页查询游戏结算记录列表（含汇总统计），返回 {list, total, totalWinOrLoss, totalBets, totalExpenses} */
    Map<String, Object> getGameRecordList(GameRecord query);
}
