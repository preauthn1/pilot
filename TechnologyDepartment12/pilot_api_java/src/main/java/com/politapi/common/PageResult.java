package com.politapi.common;

import java.util.List;

/**
 * 分页查询结果封装
 *
 * @param <T> 列表数据类型
 */
public class PageResult<T> {

    /** 当前页数据列表 */
    private List<T> list;

    /** 总记录数 */
    private long total;

    /**
     * 构造分页结果
     *
     * @param list  当前页数据列表
     * @param total 总记录数
     */
    public PageResult(List<T> list, long total) {
        this.list = list;
        this.total = total;
    }

    // ==================== Getter / Setter ====================

    public List<T> getList() {
        return list;
    }

    public void setList(List<T> list) {
        this.list = list;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }
}
