/**
 * @param selfPre 玩家自己能赢的比例
 * @param channelPre 渠道给他名下的所有玩家配的可以赢比例
 * @param payCount 玩家当前已经赢的钱
 */
export function getUserRebate(selfPre: number, channelPre: number, payCount: number): number {
    const pre = selfPre > channelPre ? channelPre : selfPre;
    const progress = payCount / pre
    if (progress > 1) {
        return 9
    } else if (progress < 0) {
        return -1
    } else {
        return -1;//Math.round(progress * 10 / 2)
    }
}