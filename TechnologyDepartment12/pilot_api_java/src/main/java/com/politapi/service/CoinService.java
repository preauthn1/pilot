package com.politapi.service;

import com.alibaba.fastjson.JSONObject;
import com.politapi.entity.Coin;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * 虚拟币/钱包服务接口
 */
public interface CoinService extends IService<Coin> {

    /** 分页查询投注记录列表（联查 user/channel/game_record），返回 {list, total} */
    Map<String, Object> getCoinRecordList(Map<String, Object> params);
}
