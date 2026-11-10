package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.CommonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 管理后台 - 通用接口（字典下拉、文件上传等）
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "通用接口", description = "字典数据、文件上传")
public class CommonController {

    @Autowired
    private CommonService commonService;

    @PostMapping("/common/dictMaps")
    @Operation(summary = "字典映射", description = "获取下拉字典数据。参数: dict_names = ['merchantList','getChannelList',...]")
    public Result<?> dictMaps(@RequestBody Map<String, Object> params) {
        return Result.ok(commonService.dictMaps(params));
    }

    @GetMapping("/common/serverTime")
    @Operation(summary = "获取服务器时间", description = "返回当前部署服务器的毫秒时间戳")
    public Result<Map<String, Number>> serverTime() {
        Instant now = Instant.now();
        int timezoneOffsetMinutes = ZoneId.systemDefault().getRules().getOffset(now).getTotalSeconds() / 60;

        Map<String, Number> data = new LinkedHashMap<>();
        data.put("serverTime", now.toEpochMilli());
        data.put("timezoneOffsetMinutes", timezoneOffsetMinutes);
        return Result.ok(data);
    }

    @PostMapping("/upload")
    @Operation(summary = "文件上传（预留）")
    public Result<?> upload(@RequestBody Map<String, Object> params) {
        return Result.ok();
    }
}
