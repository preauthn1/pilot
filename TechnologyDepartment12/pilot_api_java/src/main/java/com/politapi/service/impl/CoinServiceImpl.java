package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.Coin;
import com.politapi.mapper.CoinMapper;
import com.politapi.mapper.CoinRecordMapper;
import com.politapi.service.CoinService;
import com.politapi.util.DataScopeHelper;
import com.politapi.util.DateUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class CoinServiceImpl extends ServiceImpl<CoinMapper, Coin> implements CoinService {
    @Autowired
    private CoinRecordMapper coinRecordMapper;

    private static final int MAX_LIMIT = 100;

    private static final Map<String, String> KEY_MAP = Map.ofEntries(
            Map.entry("merchantid",         "merchantId"),
            Map.entry("channelid",          "channelId"),
            Map.entry("finishtime",         "finishTime"),
            Map.entry("bureaunumber",       "bureauNumber"),
            Map.entry("bettype",            "betType"),
            Map.entry("bettime",            "betTime"),
            Map.entry("settlementmultiple", "settlementMultiple"),
            Map.entry("billingtype",        "billingType"),
            Map.entry("userid",             "userId"),
            Map.entry("payout",             "payOut")
    );



    @Override
    public Map<String, Object> getCoinRecordList(Map<String, Object> params) {
        int limit  = Math.min(toInt(params.get("limit"), 10), MAX_LIMIT);
        int page   = Math.max(toInt(params.get("offset"), 1), 1);
        int offset = (page - 1) * limit;

        String sort = str(params.get("sort"));
        if (sort == null) {
            sort = "expand_time";
        }
        String orderVal = "descending".equals(params.get("order")) ? "desc" : "asc";

        String channelId    = str(params.get("channel_id"));
        String merchantId   = str(params.get("merchant_id"));
        String username     = str(params.get("username"));
        String tag          = str(params.get("tag"));
        String gameCode     = str(params.get("game_code"));
        String bureauNumber = str(params.get("bureau_number"));
        String id           = str(params.get("id"));

        String startAt = toTimeStr(params.get("start_at"), false);
        String endAt   = toTimeStr(params.get("end_at"), true);

        java.util.Set<Long> allowedChannelIds = DataScopeHelper.getAllowedChannelIds();

        List<Map<String, Object>> list = coinRecordMapper.getCoinRecordList(
                channelId, merchantId, username, tag, bureauNumber, gameCode,
                id, startAt, endAt, offset, limit, sort, orderVal, allowedChannelIds);
        long total = coinRecordMapper.getCoinRecordTotal(
                channelId, merchantId, username, tag, bureauNumber, gameCode, id, startAt, endAt, allowedChannelIds);

        for (Map<String, Object> row : list) {
            KEY_MAP.forEach((k, v) -> {
                if (row.containsKey(k) && !row.containsKey(v)) {
                    row.put(v, row.remove(k));
                }
            });
            long bt = toLong(row.get("betTime"), 0);
            if (bt > 0) {
                row.put("betTime", DateUtil.formatEpoch(bt));
            }
            if (row.get("finishTime") instanceof LocalDateTime dt) {
                row.put("finishTime", DateUtil.format(dt));
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", list);
        result.put("total", total);
        return result;
    }

    private static String str(Object val) {
        if (val == null) {
            return null;
        }
        String s = val.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static int toInt(Object val, int def) {
        if (val == null) {
            return def;
        }
        if (val instanceof Number n) {
            return n.intValue();
        }
        try { return Integer.parseInt(val.toString().trim()); }
        catch (NumberFormatException e) { return def; }
    }

    private static long toLong(Object val, long def) {
        if (val == null) {
            return def;
        }
        if (val instanceof Number n) {
            return n.longValue();
        }
        try { return Long.parseLong(val.toString().trim()); }
        catch (NumberFormatException e) { return def; }
    }

    private static String toTimeStr(Object obj, boolean isEnd) {
        if (obj == null) {
            return null;
        }
        String s = obj.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        long ts = DateUtil.toEpochSecond(s);
        return ts > 0 ? String.valueOf(isEnd ? ts - 1 : ts) : null;
    }
}
