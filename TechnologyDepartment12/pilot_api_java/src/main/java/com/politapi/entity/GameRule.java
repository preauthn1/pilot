package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("cms_game_rule")
public class GameRule {

    @TableId(type = IdType.AUTO)
    private Long id;

    @JsonAlias("game_code")
    @TableField("game_code")
    private String gameCode;

    @JsonAlias("rule_content")
    @TableField("rule_content")
    private String ruleContent;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}