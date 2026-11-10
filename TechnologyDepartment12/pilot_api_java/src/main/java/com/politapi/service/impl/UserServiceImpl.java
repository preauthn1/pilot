package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.entity.Coin;
import com.politapi.entity.GameSetting;
import com.politapi.entity.User;
import com.politapi.mapper.CoinMapper;
import com.politapi.mapper.GameSettingMapper;
import com.politapi.mapper.UserMapper;
import com.politapi.util.DataScopeHelper;
import com.politapi.service.FreeBetService;
import com.politapi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * 用户服务实现
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Autowired
    private CoinMapper coinMapper;

    @Autowired
    private FreeBetService freeBetService;

    @Autowired
    private GameSettingMapper gameSettingMapper;

    @Override
    public User getUserInfo(Long channelId, String username) {
        return baseMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getChannelId, channelId).eq(User::getUsername, username));
    }

    @Override
    public User getUserInfoNew(String merchantId, String username) {
        return baseMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getMerchantId, merchantId).eq(User::getUsername, username));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean createUser(String merchantId, String username, String expand, String ip, String currency, Long channelId) {
        User user = new User();
        user.setMerchantId(merchantId);
        user.setUsername(username);
        user.setExpand(expand);
        user.setCurrency(currency);
        user.setChannelId(channelId);
        user.setWinMoney(0L);
        user.setWinMoneyDay(LocalDateTime.now().minusDays(1));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        int rows = baseMapper.insert(user);
        if (rows <= 0) {
            return false;
        }
        Coin coin = new Coin();
        coin.setUserId(user.getId());
        coin.setCoin(0L);
        coin.setIsLock(0);
        coinMapper.insert(coin);
        return true;
    }

    @Override
    public Map<String, Object> getUserList(Map<String, Object> params) {
        long page = Math.max(toLong(params.get("offset"), 1), 1);
        long limit = toLong(params.get("limit"), 10);
        Long channelId = params.get("channel_id") != null ? toLong(params.get("channel_id"), 0) : null;
        String username = (String) params.get("username");
        String status = (String) params.get("status");

        LambdaQueryWrapper<User> qw = new LambdaQueryWrapper<>();
        if (channelId != null) {
            qw.eq(User::getChannelId, channelId);
        }
        if (username != null && !username.isEmpty()) {
            qw.eq(User::getUsername, username);
        }
        if (status != null && !status.isEmpty()) {
            qw.eq(User::getStatus, Integer.parseInt(status));
        }
        java.util.Set<Long> allowedChannels = DataScopeHelper.getAllowedChannelIds();
        if (allowedChannels != null) {
            qw.in(User::getChannelId, allowedChannels);
        }
        qw.orderByDesc(User::getId);
        IPage<User> pg = baseMapper.selectPage(Page.of(page, limit), qw);

        List<Map<String, Object>> list = new ArrayList<>();
        for (User u : pg.getRecords()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", u.getId());
            item.put("username", u.getUsername());
            item.put("channel_id", u.getChannelId());
            item.put("merchant_id", u.getMerchantId());
            item.put("status", u.getStatus());
            item.put("online", u.getOnline());
            item.put("currency", u.getCurrency());
            item.put("created_at", u.getCreatedAt());
            Coin coin = coinMapper.selectOne(new LambdaQueryWrapper<Coin>().eq(Coin::getUserId, u.getId()));
            item.put("coin", coin != null ? coin.getCoin() : 0L);
            item.put("is_lock", coin != null ? coin.getIsLock() : 0);
            // 免费下注数据默认值，后续批量填充
            item.put("free_bet_remain", 0);
            item.put("free_bet_amount", 0L);
            item.put("free_bet_enabled", 0);
            list.add(item);
        }

        // 批量填充免费下注数据：按渠道分组查询
        if (!list.isEmpty()) {
            // 收集所有唯一的 channelId
            Set<Long> channelIds = new HashSet<>();
            for (Map<String, Object> item : list) {
                Object cid = item.get("channel_id");
                if (cid != null) {
                    channelIds.add(((Number) cid).longValue());
                }
            }
            // 对每个渠道，批量查询剩余次数和游戏设置
            for (Long cid : channelIds) {
                // 查询游戏设置
                GameSetting gameSetting = gameSettingMapper.selectOne(
                        new LambdaQueryWrapper<GameSetting>().eq(GameSetting::getChannel, cid));
                Long freeBetAmount = (gameSetting != null && gameSetting.getFreeBetAmount() != null)
                        ? gameSetting.getFreeBetAmount() : 0L;
                Integer freeBetEnabled = (gameSetting != null && gameSetting.getFreeBetEnabled() != null)
                        ? gameSetting.getFreeBetEnabled() : 0;

                // 收集该渠道下的所有 userId
                List<Long> userIdsInChannel = new ArrayList<>();
                for (Map<String, Object> item : list) {
                    Object c = item.get("channel_id");
                    if (c != null && ((Number) c).longValue() == cid) {
                        userIdsInChannel.add(((Number) item.get("id")).longValue());
                    }
                }

                // 批量查询剩余次数
                Map<Long, Integer> remainMap = freeBetService.getRemainCountBatch(userIdsInChannel, cid);

                // 填充到每个用户
                for (Map<String, Object> item : list) {
                    Object c = item.get("channel_id");
                    if (c != null && ((Number) c).longValue() == cid) {
                        Long uid = ((Number) item.get("id")).longValue();
                        item.put("free_bet_remain", remainMap.getOrDefault(uid, 0));
                        item.put("free_bet_amount", freeBetAmount);
                        item.put("free_bet_enabled", freeBetEnabled);
                    }
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", list);
        result.put("total", pg.getTotal());
        return result;
    }

    @Override
    public void updateUserStatus(Map<String, Object> params) {
        Long userId = toLong(params.get("user_id"), 0);
        Integer status = params.get("status") != null ? Integer.parseInt(params.get("status").toString()) : null;
        if (userId == 0 || status == null) {
            throw new IllegalArgumentException("参数不完整");
        }
        User u = new User();
        u.setId(userId);
        u.setStatus(status);
        baseMapper.updateById(u);
    }

    @Override
    public String addCoin(Map<String, Object> params) {
        Long channelId = toLong(params.get("channel_id"), 0);
        String username = (String) params.get("username");
        long money = toLong(params.get("money"), 0);
        if (channelId == 0 || username == null || money <= 0) {
            throw new IllegalArgumentException("参数不完整");
        }
        User user = baseMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getChannelId, channelId).eq(User::getUsername, username));
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        Coin coin = coinMapper.selectOne(new LambdaQueryWrapper<Coin>().eq(Coin::getUserId, user.getId()));
        if (coin == null) {
            coin = new Coin();
            coin.setUserId(user.getId());
            coin.setCoin(money);
            coin.setIsLock(0);
            coinMapper.insert(coin);
        } else {
            coin.setCoin(coin.getCoin() + money);
            coinMapper.updateById(coin);
        }
        return "加币成功";
    }

    @Override
    public String openAll(Map<String, Object> params) {
        Long userId = params.get("user_id") != null ? toLong(params.get("user_id"), 0) : 0L;
        if (userId > 0) {
            Coin coin = coinMapper.selectOne(new LambdaQueryWrapper<Coin>().eq(Coin::getUserId, userId));
            if (coin == null) {
                throw new IllegalArgumentException("玩家不存在");
            }
            coin.setIsLock(0);
            coinMapper.updateById(coin);
            return "解锁成功";
        }
        coinMapper.update(null, new UpdateWrapper<Coin>().eq("is_lock", 1).set("is_lock", 0));
        return "已解锁所有玩家";
    }

    private long toLong(Object val, long defaultVal) {
        if (val == null) {
            return defaultVal;
        }
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        try {
            return Long.parseLong(val.toString());
        } catch (Exception e) {
            return defaultVal;
        }
    }
}
