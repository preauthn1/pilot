package com.politapi.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 带时间戳的实体基类 —— 在 BaseEntity 基础上增加创建时间、更新时间
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class BaseTimestampEntity extends BaseEntity {

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}
