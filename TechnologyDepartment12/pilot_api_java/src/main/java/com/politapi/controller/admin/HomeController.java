package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.HomeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 管理后台 - 首页仪表盘（按币种分组统计投注/派奖/盈亏/人数）
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "首页仪表盘", description = "首页概览：按币种统计投注、派彩、盈亏、人数")
public class HomeController {

    @Autowired
    private HomeService homeService;

    @PostMapping("/home/getHomeList")
    @Operation(summary = "首页数据", description = "按币种分组统计今日/全量投注、派彩、盈亏、人数")
    public Result<?> getHomeList() {
        return Result.ok(homeService.getHomeList());
    }
}
