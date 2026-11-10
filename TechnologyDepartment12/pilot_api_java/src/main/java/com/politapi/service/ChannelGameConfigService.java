package com.politapi.service;

import java.util.Map;

public interface ChannelGameConfigService {

    Map<String, Object> getChannelGameConfigList(Map<String, Object> params);

    Long create(Map<String, Object> params);

    void update(Map<String, Object> params);

    void delete(Long id);
}
