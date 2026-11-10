package com.politapi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.politapi.entity.Notification;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface NotificationMapper extends BaseMapper<Notification> {
}
