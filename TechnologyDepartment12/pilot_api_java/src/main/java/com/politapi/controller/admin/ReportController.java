package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理后台 - 数据报表（商户报表/渠道报表/实时渠道报表/日报表）
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "数据报表", description = "商户报表、渠道报表、实时报表、日报表")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @PostMapping("/merchantReport/getMerchantReportList")
    @Operation(summary = "商户报表")
    public Result<?> getMerchantReportList(@RequestBody Map<String, Object> params) {
        try {
            return Result.ok(reportService.getMerchantReportList(params));
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    @PostMapping("/merchantReport/getChannelReportList")
    @Operation(summary = "渠道报表")
    public Result<?> getChannelReportList(@RequestBody Map<String, Object> params) {
        return Result.ok(reportService.getChannelReportList(params));
    }

    @PostMapping("/merchantReport/getRealtimeChannelReport")
    @Operation(summary = "渠道实时报表")
    public Result<?> getRealtimeChannelReport(@RequestBody Map<String, Object> params) {
        try {
            return Result.ok(reportService.getRealtimeChannelReport(params));
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    @PostMapping("/merchantReport/getDailyReportList")
    @Operation(summary = "日报表")
    public Result<?> getDailyReportList(@RequestBody Map<String, Object> params) {
        return Result.ok(reportService.getDailyReportList(params));
    }
}
