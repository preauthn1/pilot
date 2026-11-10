package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.entity.GameRecord;
import com.politapi.service.GameRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 管理后台 - 游戏结算记录
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "结算记录", description = "查询游戏结算记录（含汇总统计）")
public class GameRecordController {

    @Autowired
    private GameRecordService gameRecordService;

    @PostMapping("/gameRecord/getGameRecordList")
    @Operation(summary = "结算记录列表", description = "分页查询游戏结算记录，含汇总统计")
    public Result<?> getGameRecordList(@RequestBody GameRecord query) {
        return Result.ok(gameRecordService.getGameRecordList(query));
    }
}
