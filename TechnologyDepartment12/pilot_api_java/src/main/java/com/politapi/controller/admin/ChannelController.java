package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.ChannelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 渠道管理
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "渠道管理", description = "渠道 CRUD")
public class ChannelController {

    @Autowired
    private ChannelService channelService;

    /** 按商户ID查询渠道 */
    @PostMapping("/channel/getChannelBy")
    @Operation(summary = "按商户查渠道", description = "参数: merchantId")
    public Result<?> getChannelBy(@RequestBody Map<String, Object> params) {
        return Result.ok(channelService.getChannelBy(params));
    }

    /** 分页查询渠道列表 */
    @PostMapping("/channel/getChannelLists")
    @Operation(summary = "渠道列表", description = "分页查询渠道，参数: offset, limit, name")
    public Result<?> getChannelList(@RequestBody Map<String, Object> params) {
        return Result.ok(channelService.getChannelList(params));
    }

    /** 创建渠道 */
    @PostMapping("/channel/create")
    @Operation(summary = "创建渠道", description = "参数: name, merchantId, playerPrefix, domain, notifyUrl, offlineUrl, amount, gameCode")
    public Result<?> create(@RequestBody Map<String, String> params) {
        try {
            return Result.ok(channelService.create(params));
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    /** 更新渠道 */
    @PostMapping("/channel/update")
    @Operation(summary = "更新渠道")
    public Result<?> update(@RequestBody Map<String, String> params) {
        channelService.update(params);
        return Result.ok();
    }

    /** 删除渠道 */
    @PostMapping("/channel/delChannel")
    @Operation(summary = "删除渠道", description = "参数: id")
    public Result<?> delChannel(@RequestBody Map<String, Object> params) {
        try {
            channelService.deleteChannel(toLong(params.get("id"), 0));
            return Result.ok();
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    private long toLong(Object val, long defaultVal) {
        if (val == null) {
            return defaultVal;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        try { return Long.parseLong(val.toString()); } catch (Exception e) { return defaultVal; }
    }
}
