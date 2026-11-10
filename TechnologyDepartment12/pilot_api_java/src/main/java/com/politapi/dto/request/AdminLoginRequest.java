package com.politapi.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Vben Admin 管理员登录请求 DTO
 */
@Data
@Schema(description = "管理员登录请求")
public class AdminLoginRequest {

    @Schema(description = "管理员用户名", example = "admin", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @Schema(description = "管理员密码", example = "123456", requiredMode = Schema.RequiredMode.REQUIRED)
    private String password;
}
