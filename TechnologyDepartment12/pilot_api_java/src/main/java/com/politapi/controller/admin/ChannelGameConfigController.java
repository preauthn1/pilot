package com.politapi.controller.admin;

import com.politapi.common.Result;
import com.politapi.service.ChannelGameConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin")
@Tag(name = "Channel Game Config", description = "Channel + game_code mapping config")
public class ChannelGameConfigController {

    @Autowired
    private ChannelGameConfigService channelGameConfigService;

    @PostMapping("/channelGameConfig/getChannelGameConfigList")
    @Operation(summary = "Channel game config list")
    public Result<?> getChannelGameConfigList(@RequestBody Map<String, Object> params) {
        return Result.ok(channelGameConfigService.getChannelGameConfigList(params));
    }

    @PostMapping("/channelGameConfig/create")
    @Operation(summary = "Create channel game config")
    public Result<?> create(@RequestBody Map<String, Object> params) {
        try {
            return Result.ok(channelGameConfigService.create(params));
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    @PostMapping("/channelGameConfig/update")
    @Operation(summary = "Update channel game config")
    public Result<?> update(@RequestBody Map<String, Object> params) {
        try {
            channelGameConfigService.update(params);
            return Result.ok();
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    @PostMapping("/channelGameConfig/delete")
    @Operation(summary = "Delete channel game config")
    public Result<?> delete(@RequestBody Map<String, Object> params) {
        try {
            channelGameConfigService.delete(toLong(params.get("id")));
            return Result.ok();
        } catch (IllegalArgumentException e) {
            return Result.fail(e.getMessage());
        }
    }

    private Long toLong(Object val) {
        if (val == null || val.toString().isBlank()) {
            return null;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        return Long.parseLong(val.toString());
    }
}
