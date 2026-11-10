package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.CoinService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 玩家投注记录（联查 user/channel/game_record）
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "投注记录", description = "查询玩家投注明细")
public class CoinRecordController {

    @Autowired
    private CoinService coinService;

    /** 分页查询投注记录列表（联查 user/channel/game_record） */
    @PostMapping("/coinRecord/getCoinRecordList")
    @Operation(summary = "投注记录列表", description = "分页查询投注明细，联查用户和渠道信息")
    public Result<?> getCoinRecordList(@RequestBody Map<String, Object> params) {
        return Result.ok(coinService.getCoinRecordList(params));
    }
}
