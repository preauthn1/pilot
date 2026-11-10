package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.CurrencySettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 币种设置
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "币种设置", description = "币种列表、新增、编辑、删除")
public class CurrencySettingController {

    @Autowired
    private CurrencySettingService currencySettingService;

    @PostMapping("/currencySetting/getCurrencyList")
    @Operation(summary = "币种列表")
    public Result<?> getCurrencyList(@RequestBody Map<String, Object> params) {
        return Result.ok(currencySettingService.getCurrencyList(params));
    }

    @PostMapping("/currencySetting/create")
    @Operation(summary = "创建渠道币种", description = "参数: channelId, currency, tag")
    public Result<?> create(@RequestBody Map<String, Object> params) {
        try {
            return Result.ok(currencySettingService.create(params));
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    @PostMapping("/currencySetting/update")
    @Operation(summary = "更新渠道币种", description = "参数: id, channelId, currency, tag")
    public Result<?> update(@RequestBody Map<String, Object> params) {
        try {
            currencySettingService.update(params);
            return Result.ok();
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    @PostMapping("/currencySetting/deleteCurrency")
    @Operation(summary = "删除币种", description = "参数: id")
    public Result<?> deleteCurrency(@RequestBody Map<String, Object> params) {
        try {
            currencySettingService.deleteCurrency(toLong(params.get("id"), 0));
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
