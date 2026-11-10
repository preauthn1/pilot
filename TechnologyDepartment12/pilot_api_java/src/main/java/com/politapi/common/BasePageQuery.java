package com.politapi.common;

import com.baomidou.mybatisplus.annotation.TableField;
import lombok.Data;

/**
 * 分页查询基类 — 所有用实体接收查询参数的 Controller 继承此类即可。
 *
 * <pre>
 * 用法：
 *   public class GameRecord extends BasePageQuery {
 *       private String roundId;
 *       // ...
 *   }
 *
 *   // Controller:
 *   public Result&lt;?&gt; list(@RequestBody GameRecord query) {
 *       service.getList(query); // service 里直接调 query.getSqlOffset() / query.getLimit()
 *   }
 * </pre>
 */
@Data
public abstract class BasePageQuery {

    /** 页码（1-based），默认 1 */
    @TableField(exist = false)
    private Integer offset = 1;

    /** 每页条数，默认 10 */
    @TableField(exist = false)
    private Integer limit = 10;

    /** 排序字段（可选） */
    @TableField(exist = false)
    private String sort;

    /** 排序方向：ascending / descending（可选） */
    @TableField(exist = false)
    private String order;

    /** @return SQL OFFSET（0-based），即 (page - 1) * pageSize */
    public int getSqlOffset() {
        int page = Math.max(offset != null ? offset : 1, 1);
        int size = limit != null && limit > 0 ? limit : 10;
        return (page - 1) * size;
    }

    public int getLimit() {
        return limit != null && limit > 0 ? limit : 10;
    }
}
