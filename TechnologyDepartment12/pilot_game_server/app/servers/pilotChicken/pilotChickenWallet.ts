import { ChickenWalletGateway, FreeBetReservationResult } from '../../games/pilot-chicken/pilotChickenGameService'
import { getBalanceNew, bet_danQianBao, cancel_danQianBao, settle_danQianBao, freeBetUse, freeBetRemain } from '../../util/HttpsUtil'
import { UserService } from '../../services/userService'

export interface PilotChickenWalletIdentity { userId: number; username: string; channelId: string | number; merchantId: string | number; gameCode: string }
export interface PilotChickenFreeBetStatus { remainCount: number; freeBetAmount: number }
interface GameSetting { url: string }
const BALANCE_TIMEOUT_MS = 2000

export async function loadPilotChickenWalletIdentity(userService: UserService, userId: number, gameCode: string): Promise<PilotChickenWalletIdentity> {
    const user = await userService.loadUserInfo(userId)
    if (!user || !user.username || user.channelId === undefined || user.merchantId === undefined) throw new Error('未找到钱包用户信息')
    return { userId, username: user.username, channelId: user.channelId, merchantId: user.merchantId, gameCode }
}

export async function loadPilotChickenFreeBetStatus(identity: PilotChickenWalletIdentity, setting: GameSetting): Promise<PilotChickenFreeBetStatus> {
    if (!setting?.url) throw new Error('wallet service is unavailable')
    const result = await freeBetRemain(identity.userId, Number(identity.channelId), setting.url, identity.gameCode)
    const remainCount = result?.code === 0 ? result.data?.remainCount : undefined
    const freeBetAmount = result?.code === 0 ? result.data?.freeBetAmount : undefined
    if (!Number.isSafeInteger(remainCount) || remainCount < 0) throw new Error('free bet remain response is missing a valid remaining count')
    return { remainCount, freeBetAmount: Number.isSafeInteger(freeBetAmount) && freeBetAmount > 0 ? freeBetAmount : 0 }
}

export async function loadPilotChickenFreeBetCount(identity: PilotChickenWalletIdentity, setting: GameSetting): Promise<number> {
    return (await loadPilotChickenFreeBetStatus(identity, setting)).remainCount
}

export function createPilotChickenWallet(identity: PilotChickenWalletIdentity, setting: GameSetting): ChickenWalletGateway {
    if (!setting?.url) throw new Error('钱包接口不可用')
    const host = setting.url
    const channelId = String(identity.channelId)
    return {
        async reserveBet(roundId, betAmount, useFreeBet): Promise<FreeBetReservationResult | undefined> {
            if (!useFreeBet) {
                ensureWalletSuccess(await bet_danQianBao(identity.username, channelId, betAmount, roundId, host, identity.merchantId, identity.gameCode), 'paid bet')
                return undefined
            }
            const result = await freeBetUse(identity.userId, Number(channelId), roundId, host, identity.gameCode)
            ensureWalletSuccess(result, 'free bet')
            const remainCount = result.data?.remainCount
            if (typeof remainCount !== 'number' || !Number.isSafeInteger(remainCount) || remainCount < 0) throw new Error('free bet response is missing a valid remaining count')
            return { remainCount }
        },

        async settleRound(roundId, payoutAmount) { ensureWalletSuccess(await settle_danQianBao(identity.username, channelId, roundId, payoutAmount, host, identity.merchantId, identity.gameCode), '结算') },
        async cancelBet(roundId, betAmount) { ensureWalletSuccess(await cancel_danQianBao(identity.username, channelId, roundId, betAmount, host, identity.merchantId, identity.gameCode), '撤单') },
    }
}

export async function loadPilotChickenBalance(identity: PilotChickenWalletIdentity, setting: GameSetting): Promise<number> {
    if (!setting?.url) return 0
    try {
        const result = await withTimeout(getBalanceNew(identity.username, identity.channelId, setting.url, identity.merchantId, identity.gameCode), BALANCE_TIMEOUT_MS)
        const balance = result?.code === 0 ? Number(result.data?.balance) : Number.NaN
        return Number.isFinite(balance) ? balance : 0
    } catch (_error) {
        return 0
    }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('钱包余额查询超时')), timeoutMs)
        promise.then(value => { clearTimeout(timer); resolve(value) }, error => { clearTimeout(timer); reject(error) })
    })
}

function ensureWalletSuccess(result: any, action: string): void { if (!result || result.code !== 0) throw new Error(result?.msg || `${action}钱包请求失败`) }


