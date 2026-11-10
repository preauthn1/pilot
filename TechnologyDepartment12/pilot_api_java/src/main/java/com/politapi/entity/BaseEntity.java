package com.politapi.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Entity 基类 —— 统一 id、逻辑删除字段
 */
@Data
public class BaseEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 主键ID，自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 逻辑删除标记 */
    @TableLogic
    private LocalDateTime deletedAt;
}
