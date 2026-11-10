package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.MerchantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 商户管理
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "商户管理", description = "商户 CRUD、修改密码")
public class MerchantController {

    @Autowired
    private MerchantService merchantService;

    @PostMapping("/merchant/getMerchantList")
    @Operation(summary = "商户列表", description = "分页查询商户。参数: offset, limit, username")
    public Result<?> getMerchantList(@RequestBody Map<String, Object> params) {
        return Result.ok(merchantService.getMerchantList(params));
    }

    @PostMapping("/merchant/create")
    @Operation(summary = "创建商户", description = "参数: username, secret, returnUrl（返回地址）, walletType")
    public Result<?> create(@RequestBody Map<String, String> params) {
        try {
            return Result.ok(merchantService.create(params));
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    @PostMapping("/merchant/update")
    @Operation(summary = "更新商户", description = "参数: id, username, secret, returnUrl（返回地址）, walletType")
    public Result<?> update(@RequestBody Map<String, String> params) {
        try {
            merchantService.update(params);
            return Result.ok();
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    @PostMapping("/merchant/delMerchant")
    @Operation(summary = "删除商户", description = "参数: id")
    public Result<?> delMerchant(@RequestBody Map<String, Object> params) {
        try {
            merchantService.delete(toLong(params.get("id"), 0));
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
