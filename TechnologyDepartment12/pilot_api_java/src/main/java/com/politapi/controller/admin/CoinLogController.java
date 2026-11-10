package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.CoinLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 币种日志
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "金币日志", description = "查询金币变动日志")
public class CoinLogController {

    @Autowired
    private CoinLogService coinLogService;

    /** 分页查询币种日志列表 */
    @PostMapping("/coinLog/getCoinLogList")
    @Operation(summary = "金币日志列表", description = "分页查询金币变动记录")
    public Result<?> getCoinLogList(@RequestBody Map<String, Object> params) {
        return Result.ok(coinLogService.getCoinLogList(params));
    }
}
