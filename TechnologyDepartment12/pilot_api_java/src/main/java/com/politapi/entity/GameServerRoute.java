package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("game_server_route")
public class GameServerRoute {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("game_code")
    private String gameCode;

    @TableField("server_type")
    private String serverType;

    @TableField("operation_type")
    private String operationType;

    private Integer priority;

    private Integer status;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
