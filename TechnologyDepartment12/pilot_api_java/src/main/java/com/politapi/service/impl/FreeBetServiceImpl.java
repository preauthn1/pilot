package com.politapi.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.politapi.dto.response.FreeBetRemainResponse;
import com.politapi.entity.Channel;
import com.politapi.entity.GameSetting;
import com.politapi.entity.SystemConfig;
import com.politapi.entity.UmsFreeBetLog;
import com.politapi.entity.UmsUserFreeBet;
import com.politapi.entity.User;
import com.politapi.mapper.ChannelMapper;
import com.politapi.mapper.GameSettingMapper;
import com.politapi.mapper.SystemConfigMapper;
import com.politapi.mapper.UmsFreeBetLogMapper;
import com.politapi.mapper.UmsUserFreeBetMapper;
import com.politapi.mapper.UserMapper;
import com.politapi.service.FreeBetService;
import com.politapi.util.SignUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 免费下注服务实现
 */
@Slf4j
@Service
public class FreeBetServiceImpl extends ServiceImpl<UmsUserFreeBetMapper, UmsUserFreeBet> implements FreeBetService {

    @Autowired
    private UmsUserFreeBetMapper umsUserFreeBetMapper;

    @Autowired
    private UmsFreeBetLogMapper umsFreeBetLogMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ChannelMapper channelMapper;

    @Autowired
    private GameSettingMapper gameSettingMapper;

    @Autowired
    private SystemConfigMapper systemConfigMapper;

    @Override
    @Transactional
    public Map<String, Object> grant(String username, String channel, Integer count, String activityId, String sourceOrderId, LocalDateTime expireAt, Integer multiple, String gameCode) {
        Map<String, Object> result = new HashMap<>();

        // 1. 参数校验
        if (count == null || count <= 0) {
            result.put("code", 404);
            result.put("message", "count 非法（≤0）");
            return result;
        }

        if (expireAt != null && expireAt.isBefore(LocalDateTime.now())) {
            result.put("code", 405);
            result.put("message", "expireAt 已过期");
            return result;
        }
        if (multiple != null && multiple <= 0) {
            result.put("code", 406);
            result.put("message", "multiple 非法");
            return result;
        }
        String gameScope = normalizeGameCode(gameCode);
        if (gameScope.length() > 64) {
            result.put("code", 407);
            result.put("message", "gameCode 非法");
            return result;
        }

        // 2. 查找渠道（channel 参数为渠道名称）
        Channel channelObj = channelMapper.selectOne(new LambdaQueryWrapper<Channel>().eq(Channel::getName, channel));
        if (channelObj == null) {
            result.put("code", 201);
            result.put("message", "渠道不存在");
            return result;
        }
        Long channelId = channelObj.getId();

        // 3. 查找渠道配置
        GameSetting gameSetting = gameSettingMapper.selectOne(new LambdaQueryWrapper<GameSetting>()
                .eq(GameSetting::getChannel, channelId));
        if (gameSetting == null) {
            result.put("code", 201);
            result.put("message", "渠道游戏配置不存在");
            return result;
        }

        // 4. 校验是否开启免费下注
        if (gameSetting.getFreeBetEnabled() != 1) {
            result.put("code", 402);
            result.put("message", "渠道未开启免费下注");
            return result;
        }

        if (username == null || username.trim().isEmpty()) {
            result.put("code", 304);
            result.put("message", "用户不存在");
            return result;
        }

        // 5. 查找用户（区分渠道）
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username).eq(User::getChannelId, channelId));
        if (user == null) {
            result.put("code", 304);
            result.put("message", "用户不存在");
            return result;
        }

        // 5. 幂等性检查
        UmsFreeBetLog existLog = umsFreeBetLogMapper.selectOne(new LambdaQueryWrapper<UmsFreeBetLog>().eq(UmsFreeBetLog::getSourceOrderId, sourceOrderId));
        if (existLog != null) {
            result.put("code", 105);
            result.put("message", "sourceOrderId 已处理（幂等命中）");
            UmsUserFreeBet userFreeBet = getUserFreeBet(user.getId(), channelId, gameCodeOf(existLog));
            result.put("data", buildResponseData(user.getId(), userFreeBet, gameSetting.getFreeBetAmount(), count));
            return result;
        }

        // 6. 清理过期记录
        expireOldRecords(user.getId(), channelId);

        // 7. 获取或创建用户免费次数记录
        UmsUserFreeBet userFreeBet = getUserFreeBet(user.getId(), channelId, gameScope);
        if (userFreeBet == null) {
            userFreeBet = new UmsUserFreeBet();
            userFreeBet.setUserId(user.getId());
            userFreeBet.setChannelId(channelId);
            userFreeBet.setRemainCount(0);
            userFreeBet.setTotalGranted(0);
            userFreeBet.setTotalUsed(0);
            userFreeBet.setGameCode(gameScope);
            umsUserFreeBetMapper.insert(userFreeBet);
        }

        // 8. 事务内更新：增加次数、记录发放流水，并保存上游传来的流水倍数
        if (multiple != null) {
            userFreeBet.setMultiple(multiple);
        }
        userFreeBet.setRemainCount(userFreeBet.getRemainCount() + count);
        userFreeBet.setTotalGranted(userFreeBet.getTotalGranted() + count);
        umsUserFreeBetMapper.updateById(userFreeBet);

        UmsFreeBetLog log = new UmsFreeBetLog();
        log.setUserId(user.getId());
        log.setChannelId(channelId);
        log.setAction(1); // 发放
        log.setCount(count);
        log.setBetAmount(gameSetting.getFreeBetAmount());
        log.setActivityId(activityId);
        log.setSourceOrderId(sourceOrderId);
        log.setGameCode(gameScope);
        log.setExpireAt(expireAt);
        log.setStatus(0);
        umsFreeBetLogMapper.insert(log);

        // 9. 返回成功结果
        result.put("code", 0);
        result.put("data", buildResponseData(user.getId(), userFreeBet, gameSetting.getFreeBetAmount(), count));
        return result;
    }

    @Override
    public Integer getRemainCount(Long userId, Long channelId) {
        return getRemainCount(userId, channelId, null);
    }

    @Override
    public Integer getRemainCount(Long userId, Long channelId, String gameCode) {
        expireOldRecords(userId, channelId);
        String requested = normalizeGameCode(gameCode);
        int remain = remainOf(getUserFreeBet(userId, channelId, ""));
        if (!requested.isEmpty()) {
            remain += remainOf(getUserFreeBet(userId, channelId, requested));
        }
        return remain;
    }

    @Override
    public Long getFreeBetAmount(Long channelId) {
        GameSetting gameSetting = gameSettingMapper.selectOne(new LambdaQueryWrapper<GameSetting>()
                .eq(GameSetting::getChannel, channelId));
        return gameSetting == null ? null : gameSetting.getFreeBetAmount();
    }

    @Override
    @Transactional
    public boolean useFreeBet(Long userId, Long channelId, String roundId) {
        return useFreeBet(userId, channelId, roundId, null);
    }

    @Override
    @Transactional
    public boolean useFreeBet(Long userId, Long channelId, String roundId, String gameCode) {
        UmsFreeBetLog existingUseLog = umsFreeBetLogMapper.selectOne(new LambdaQueryWrapper<UmsFreeBetLog>()
                .eq(UmsFreeBetLog::getUserId, userId)
                .eq(UmsFreeBetLog::getChannelId, channelId)
                .eq(UmsFreeBetLog::getAction, 2)
                .eq(UmsFreeBetLog::getRoundId, roundId)
                .eq(UmsFreeBetLog::getStatus, 0)
                .last("LIMIT 1"));
        if (existingUseLog != null) {
            return true;
        }

        String requested = normalizeGameCode(gameCode);
        UmsUserFreeBet userFreeBet = null;
        if (!requested.isEmpty()) {
            UmsUserFreeBet specific = getUserFreeBet(userId, channelId, requested);
            if (specific != null && specific.getRemainCount() != null && specific.getRemainCount() > 0) {
                userFreeBet = specific;
            }
        }
        if (userFreeBet == null) {
            userFreeBet = getUserFreeBet(userId, channelId, "");
        }
        if (userFreeBet == null || userFreeBet.getRemainCount() == null || userFreeBet.getRemainCount() <= 0) {
            return false;
        }

        userFreeBet.setRemainCount(userFreeBet.getRemainCount() - 1);
        userFreeBet.setTotalUsed(userFreeBet.getTotalUsed() + 1);
        umsUserFreeBetMapper.updateById(userFreeBet);

        UmsFreeBetLog log = new UmsFreeBetLog();
        log.setUserId(userId);
        log.setChannelId(channelId);
        log.setAction(2);
        log.setCount(-1);
        log.setRoundId(roundId);
        log.setGameCode(gameCodeOf(userFreeBet));
        log.setMultiple(userFreeBet.getMultiple());
        log.setStatus(0);
        umsFreeBetLogMapper.insert(log);

        return true;
    }

    @Override
    @Transactional
    public Integer expireOldRecords(Long userId, Long channelId) {
        List<UmsFreeBetLog> expiring = umsFreeBetLogMapper.selectList(new LambdaQueryWrapper<UmsFreeBetLog>()
                .eq(UmsFreeBetLog::getUserId, userId)
                .eq(UmsFreeBetLog::getChannelId, channelId)
                .eq(UmsFreeBetLog::getAction, 1)
                .eq(UmsFreeBetLog::getStatus, 0)
                .isNotNull(UmsFreeBetLog::getExpireAt)
                .lt(UmsFreeBetLog::getExpireAt, LocalDateTime.now()));
        if (expiring.isEmpty()) {
            return 0;
        }

        umsFreeBetLogMapper.update(null, new LambdaUpdateWrapper<UmsFreeBetLog>()
                .eq(UmsFreeBetLog::getUserId, userId)
                .eq(UmsFreeBetLog::getChannelId, channelId)
                .eq(UmsFreeBetLog::getAction, 1)
                .eq(UmsFreeBetLog::getStatus, 0)
                .isNotNull(UmsFreeBetLog::getExpireAt)
                .lt(UmsFreeBetLog::getExpireAt, LocalDateTime.now())
                .set(UmsFreeBetLog::getStatus, 1));

        Map<String, Integer> expiredByGame = new HashMap<>();
        for (UmsFreeBetLog log : expiring) {
            String scope = gameCodeOf(log);
            expiredByGame.merge(scope, log.getCount() == null ? 0 : log.getCount(), Integer::sum);
        }
        int totalExpiredCount = 0;
        for (Map.Entry<String, Integer> entry : expiredByGame.entrySet()) {
            totalExpiredCount += entry.getValue();
            UmsUserFreeBet userFreeBet = getUserFreeBet(userId, channelId, entry.getKey());
            if (userFreeBet == null || entry.getValue() <= 0) {
                continue;
            }
            userFreeBet.setRemainCount(Math.max(0, (userFreeBet.getRemainCount() == null ? 0 : userFreeBet.getRemainCount()) - entry.getValue()));
            umsUserFreeBetMapper.updateById(userFreeBet);
        }
        return totalExpiredCount;
    }

    @Override
    @Transactional
    public boolean recoverFreeBet(Long userId, Long channelId, String roundId) {
        // 幂等检查：同一 roundId 已恢复过，直接返回成功
        if (roundId != null && !roundId.isEmpty()) {
            UmsFreeBetLog existRecover = umsFreeBetLogMapper.selectOne(
                    new LambdaQueryWrapper<UmsFreeBetLog>()
                            .eq(UmsFreeBetLog::getUserId, userId)
                            .eq(UmsFreeBetLog::getChannelId, channelId)
                            .eq(UmsFreeBetLog::getAction, 5)
                            .eq(UmsFreeBetLog::getRoundId, roundId)
            );
            if (existRecover != null) {
                return true; // 已恢复过，幂等返回成功
            }
        }

        UmsFreeBetLog useLog = umsFreeBetLogMapper.selectOne(new LambdaQueryWrapper<UmsFreeBetLog>()
                .eq(UmsFreeBetLog::getUserId, userId)
                .eq(UmsFreeBetLog::getChannelId, channelId)
                .eq(UmsFreeBetLog::getAction, 2)
                .eq(UmsFreeBetLog::getRoundId, roundId)
                .last("LIMIT 1"));
        UmsUserFreeBet userFreeBet = getUserFreeBet(userId, channelId, gameCodeOf(useLog));
        if (userFreeBet == null) {
            return false;
        }

        userFreeBet.setRemainCount(userFreeBet.getRemainCount() + 1);
        if (userFreeBet.getTotalUsed() > 0) {
            userFreeBet.setTotalUsed(userFreeBet.getTotalUsed() - 1);
        }
        umsUserFreeBetMapper.updateById(userFreeBet);

        // 记录恢复流水
        UmsFreeBetLog log = new UmsFreeBetLog();
        log.setUserId(userId);
        log.setChannelId(channelId);
        log.setAction(5); // 5 = 取消恢复
        log.setCount(1);
        log.setRoundId(roundId);
        log.setGameCode(gameCodeOf(userFreeBet));
        log.setStatus(0);
        log.setRemark("取消下注恢复免费次数");
        umsFreeBetLogMapper.insert(log);

        return true;
    }

    @Override
    public UmsFreeBetLog findActiveFreeBetUse(Long userId, Long channelId, String roundId) {
        if (userId == null || channelId == null || roundId == null || roundId.isEmpty()) {
            return null;
        }
        UmsFreeBetLog recoverLog = umsFreeBetLogMapper.selectOne(new LambdaQueryWrapper<UmsFreeBetLog>()
                .eq(UmsFreeBetLog::getUserId, userId)
                .eq(UmsFreeBetLog::getChannelId, channelId)
                .eq(UmsFreeBetLog::getAction, 5)
                .eq(UmsFreeBetLog::getRoundId, roundId)
                .last("LIMIT 1"));
        if (recoverLog != null) {
            return null;
        }
        return umsFreeBetLogMapper.selectOne(new LambdaQueryWrapper<UmsFreeBetLog>()
                .eq(UmsFreeBetLog::getUserId, userId)
                .eq(UmsFreeBetLog::getChannelId, channelId)
                .eq(UmsFreeBetLog::getAction, 2)
                .eq(UmsFreeBetLog::getRoundId, roundId)
                .eq(UmsFreeBetLog::getStatus, 0)
                .last("LIMIT 1"));
    }

    @Override
    public UmsUserFreeBet getUserFreeBet(Long userId, Long channelId) {
        return getUserFreeBet(userId, channelId, "");
    }

    private UmsUserFreeBet getUserFreeBet(Long userId, Long channelId, String gameCode) {
        return baseMapper.selectOne(new LambdaQueryWrapper<UmsUserFreeBet>()
                .eq(UmsUserFreeBet::getUserId, userId)
                .eq(UmsUserFreeBet::getChannelId, channelId)
                .eq(UmsUserFreeBet::getGameCode, normalizeGameCode(gameCode))
        );
    }

    @Override
    public LocalDateTime getNearestExpireAt(Long userId, Long channelId) {
        UmsFreeBetLog nearest = umsFreeBetLogMapper.selectOne(
                new LambdaQueryWrapper<UmsFreeBetLog>()
                        .select(UmsFreeBetLog::getExpireAt)
                        .eq(UmsFreeBetLog::getUserId, userId)
                        .eq(UmsFreeBetLog::getChannelId, channelId)
                        .eq(UmsFreeBetLog::getAction, 1)
                        .eq(UmsFreeBetLog::getStatus, 0)
                        .isNotNull(UmsFreeBetLog::getExpireAt)
                        .orderByAsc(UmsFreeBetLog::getExpireAt)
                        .last("LIMIT 1")
        );
        return nearest != null ? nearest.getExpireAt() : null;
    }

    @Override
    public Map<Long, Integer> getRemainCountBatch(List<Long> userIds, Long channelId) {
        Map<Long, Integer> result = new HashMap<>();
        if (userIds == null || userIds.isEmpty()) {
            return result;
        }
        List<UmsUserFreeBet> list = baseMapper.selectList(new LambdaQueryWrapper<UmsUserFreeBet>()
                .in(UmsUserFreeBet::getUserId, userIds)
                .eq(UmsUserFreeBet::getChannelId, channelId));
        for (UmsUserFreeBet ufb : list) {
            int remain = ufb.getRemainCount() == null ? 0 : ufb.getRemainCount();
            result.merge(ufb.getUserId(), remain, Integer::sum);
        }
        return result;
    }

    /**
     * 校验请求签名
     * <p>
     * 从 cms_system_config 获取 MD5Key 作为签名密钥，用于验证活动系统调用的请求签名
     * </p>
     */
    @Override
    public boolean verifyRequestSign(Map<String, Object> params, String sign) {
        SystemConfig md5Config = systemConfigMapper.selectOne(new LambdaQueryWrapper<SystemConfig>().eq(SystemConfig::getCfgKey, "MD5Key"));
        if (md5Config == null || md5Config.getCfgValue() == null) {
            log.error("验签失败: cms_system_config 中未找到 MD5Key");
            return false;
        }
        String secret = md5Config.getCfgValue();

        Map<String, Object> verifyParams = new HashMap<>(params);
        verifyParams.remove("sign");

        return SignUtil.verifySign(verifyParams, secret, sign);
    }

    /**
     * 查询用户剩余免费次数信息（整合用户校验、渠道解析、游戏配置查询）
     * <p>
     * 将原本分散在 Controller 中的多个 Mapper 调用汇总到一个 Service 方法中，
     * 统一返回 code + message + data 结构，Controller 层只需透传结果。
     * </p>
     */
    @Override
    public Map<String, Object> getRemainInfo(String username, String channelParam) {
        Map<String, Object> result = new HashMap<>();

        // 1. 解析渠道ID（支持渠道名称或数字ID）
        long channelId;
        try {
            channelId = Long.parseLong(channelParam);
        } catch (NumberFormatException e) {
            Channel channelObj = channelMapper.selectOne(new LambdaQueryWrapper<Channel>()
                    .eq(Channel::getName, channelParam));
            if (channelObj == null) {
                result.put("code", 201);
                result.put("message", "渠道不存在");
                return result;
            }
            channelId = channelObj.getId();
        }

        // 2. 查找用户（区分渠道）
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
                .eq(User::getChannelId, channelId));
        if (user == null) {
            result.put("code", 304);
            result.put("message", "用户不存在");
            return result;
        }

        // 3. 获取剩余次数
        Integer remainCount = getRemainCount(user.getId(), channelId);

        // 4. 获取游戏配置中的单次金额
        GameSetting gameSetting = gameSettingMapper.selectOne(new LambdaQueryWrapper<GameSetting>()
                .eq(GameSetting::getChannel, channelId));
        Long freeBetAmount = 0L;
        if (gameSetting != null) {
            freeBetAmount = gameSetting.getFreeBetAmount();
        }

        // 5. 获取过期信息
        LocalDateTime nearestExpireAt = getNearestExpireAt(user.getId(), channelId);

        FreeBetRemainResponse data = FreeBetRemainResponse.builder()
                .remainCount(remainCount)
                .freeBetAmount(freeBetAmount)
                .expireAt(nearestExpireAt != null ? nearestExpireAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null)
                .build();

        result.put("code", 0);
        result.put("data", data);
        return result;
    }

    /**
     * 构建响应数据
     */
    private Map<String, Object> buildResponseData(Long userId, UmsUserFreeBet userFreeBet, Long freeBetAmount, Integer grantedCount) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", userId);
        data.put("remainCount", userFreeBet != null ? userFreeBet.getRemainCount() : 0);
        data.put("grantedCount", grantedCount);
        data.put("freeBetAmount", freeBetAmount);
        data.put("multiple", userFreeBet != null ? userFreeBet.getMultiple() : null);
        data.put("gameCode", userFreeBet == null || gameCodeOf(userFreeBet).isEmpty() ? null : userFreeBet.getGameCode());
        return data;
    }

    private int remainOf(UmsUserFreeBet userFreeBet) {
        return userFreeBet == null || userFreeBet.getRemainCount() == null ? 0 : userFreeBet.getRemainCount();
    }

    private String gameCodeOf(UmsFreeBetLog log) {
        return log == null ? "" : normalizeGameCode(log.getGameCode());
    }

    private String gameCodeOf(UmsUserFreeBet userFreeBet) {
        return userFreeBet == null ? "" : normalizeGameCode(userFreeBet.getGameCode());
    }

    private String normalizeGameCode(String gameCode) {
        return gameCode == null ? "" : gameCode.trim();
    }

}
