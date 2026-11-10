package com.politapi.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.politapi.entity.UmsFreeBetLog;
import com.politapi.entity.UmsUserFreeBet;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 免费下注服务接口
 */
public interface FreeBetService extends IService<UmsUserFreeBet> {

    /**
     * 发放免费次数（活动系统调用）
     *
     * @param username 用户名
     * @param channel 渠道名称
     * @param count 发放次数
     * @param activityId 上游活动ID
     * @param sourceOrderId 上游发放单号（幂等键）
     * @param expireAt 过期日期
     * @param multiple 流水倍数，正整数；为空时不覆盖已保存的倍数
     * @param gameCode 游戏代码；为空表示所有游戏可用
     * @return 发放结果
     */
    Map<String, Object> grant(String username, String channel, Integer count, String activityId,
                             String sourceOrderId, LocalDateTime expireAt, Integer multiple, String gameCode);

    /**
     * 校验请求签名
     *
     * @param params 原始请求参数（包含 sign 字段）
     * @param sign 客户端传来的签名值
     * @return true 验签通过
     */
    boolean verifyRequestSign(Map<String, Object> params, String sign);

    /**
     * 查询用户剩余免费次数信息（整合用户校验、渠道解析、游戏配置查询）
     *
     * @param username 用户名
     * @param channel 渠道名称或ID（字符串）
     * @return { "code": 0 表示成功, "message": 错误信息, "data": FreeBetRemainResponse }
     */
    Map<String, Object> getRemainInfo(String username, String channel);

    /**
     * 查询用户剩余次数
     *
     * @param userId 用户ID
     * @param channelId 渠道ID
     * @return 剩余次数
     */
    Integer getRemainCount(Long userId, Long channelId);

    /**
     * 查询某个游戏可用的剩余次数。
     * gameCode 为空时只返回不限游戏的次数；有值时返回该游戏专属次数加上不限游戏的次数。
     */
    Integer getRemainCount(Long userId, Long channelId, String gameCode);

    Long getFreeBetAmount(Long channelId);

    /**
     * 查询用户最近到期时间
     *
     * @param userId 用户ID
     * @param channelId 渠道ID
     * @return 最近到期时间，不存在时返回 null
     */
    LocalDateTime getNearestExpireAt(Long userId, Long channelId);

    /**
     * 使用免费次数
     *
     * @param userId 用户ID
     * @param channelId 渠道ID
     * @param roundId 轮次ID
     * @return 是否成功
     */
    boolean useFreeBet(Long userId, Long channelId, String roundId);

    /**
     * 使用免费次数。指定游戏时优先扣该游戏的次数，不足再扣不限游戏的次数。
     */
    boolean useFreeBet(Long userId, Long channelId, String roundId, String gameCode);

    /**
     * 恢复免费次数（取消下注时调用）
     *
     * @param userId 用户ID
     * @param channelId 渠道ID
     * @param roundId 轮次ID（幂等键）
     */
    boolean recoverFreeBet(Long userId, Long channelId, String roundId);

    /**
     * 查询尚未取消恢复的免费使用记录。结算用它读取扣次数时的流水倍数快照。
     *
     * @return 有效使用记录；普通下注或已恢复的免费局返回 null
     */
    UmsFreeBetLog findActiveFreeBetUse(Long userId, Long channelId, String roundId);

    /**
     * 清理过期记录并扣减用户额度
     *
     * @param userId 用户ID
     * @param channelId 渠道ID
     * @return 过期的次数
     */
    Integer expireOldRecords(Long userId, Long channelId);

    /**
     * 获取用户免费次数信息
     *
     * @param userId 用户ID
     * @param channelId 渠道ID
     * @return 用户免费次数对象
     */
    UmsUserFreeBet getUserFreeBet(Long userId, Long channelId);

    /**
     * 批量查询用户剩余免费次数
     *
     * @param userIds 用户ID列表
     * @param channelId 渠道ID
     * @return userId -> remainCount 的映射
     */
    Map<Long, Integer> getRemainCountBatch(List<Long> userIds, Long channelId);
}
