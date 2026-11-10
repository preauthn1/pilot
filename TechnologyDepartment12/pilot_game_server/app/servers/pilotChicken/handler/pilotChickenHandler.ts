import { randomInt } from 'crypto'
import { Application, BackendSession, getLogger } from 'pinus'
import { Code } from '../../../consts/code'
import { ChickenRoundStatus } from '../../../games/pilot-chicken/chickenRound'
import { getPilotChickenDifficulty, resolvePilotChickenMineCell, resolvePilotChickenTargetRtp } from '../../../games/pilot-chicken/pilotChickenDifficulty'
import pilotChickenGameService, { generatePilotChickenRoundId } from '../../../games/pilot-chicken/pilotChickenGameService'
import { PilotChickenRecordService } from '../../../services/pilotChickenRecordService'
import { UserService } from '../../../services/userService'
import { createPilotChickenWallet, loadPilotChickenBalance, loadPilotChickenFreeBetStatus, loadPilotChickenWalletIdentity } from '../pilotChickenWallet'

const MULTIPLIER_EVENT_ROUTE = 'pilotChicken.multiplier'
const MULTIPLIER_HISTORY_LIMIT = 40

const handlersByApplication = new WeakMap<Application, PilotChickenHandler>()

export default function (app: Application) { return getPilotChickenHandler(app) }

export function getPilotChickenHandler(app: Application): PilotChickenHandler {
    const existingHandler = handlersByApplication.get(app)
    if (existingHandler) return existingHandler
    const handler = new PilotChickenHandler(app, app.get('userService'), app.get('setting'), app.get('pilotChickenRecordService'))
    handlersByApplication.set(app, handler)
    return handler
}

export class PilotChickenHandler {
    private readonly gameService = pilotChickenGameService
    private readonly recentMultiplierUnitsByGameKey = new Map<string, number[]>()
    private readonly targetRtpByGameCode = new Map<string, number | null>()
    private readonly riskControlLoadedGameCodes = new Set<string>()
    public constructor(private readonly app: Application, private readonly userService: UserService, private readonly setting: { url: string }, private readonly recordService: PilotChickenRecordService) {}

    public async reloadRiskControl(gameCode: string): Promise<void> {
        const normalizedGameCode = this.normalizeGameCode(gameCode)
        if (!normalizedGameCode) return
        const controlService = this.app.get('controlService') as { getGlobalGameRiskRebate(gameCode: string): Promise<number | null> }
        try {
            const targetKillRate = await controlService.getGlobalGameRiskRebate(normalizedGameCode)
            this.targetRtpByGameCode.set(normalizedGameCode, targetKillRate === null ? null : resolvePilotChickenTargetRtp(targetKillRate))
        } catch (error) {
            this.getLogger(normalizedGameCode).error('重新加载飞行小鸡 RTP 配置失败', error)
            this.targetRtpByGameCode.set(normalizedGameCode, null)
        } finally {
            this.riskControlLoadedGameCodes.add(normalizedGameCode)
        }
    }

    public async enterRequest(_message: {}, session: BackendSession) {
        const userId = this.validateSession(session)
        const gameCode = this.getSessionGameCode(session)
        if (userId === null || !gameCode) return { code: Code.ERROR_PARAM, msg: 'invalid game session' }
        try {
            const identity = await loadPilotChickenWalletIdentity(this.userService, userId, gameCode)
            const freeBetStatus = await loadPilotChickenFreeBetStatus(identity, this.setting)
            this.addPlayerToMultiplierChannel(identity.channelId, gameCode, userId, session)
            const recentMultiplierUnits = await this.loadRecentMultiplierUnits(identity.channelId, gameCode)
            return { code: Code.OK, data: { ...this.gameService.enter(userId), balance: await loadPilotChickenBalance(identity, this.setting), freeBetCount: freeBetStatus.remainCount, canUseFreeBet: this.canUseFreeBet(freeBetStatus), freeBetAmount: freeBetStatus.freeBetAmount, recentMultiplierUnits } }
        }
        catch (error) { return { code: Code.ERROR_PARAM, msg: this.getErrorMessage(error) } }
    }

    public async betRequest(message: { betAmount: number, difficulty?: string, mineCell?: number, useFreeBet?: boolean }, session: BackendSession) {
        const userId = this.validateSession(session)
        const gameCode = this.getSessionGameCode(session)
        if (userId === null || !gameCode || !Number.isSafeInteger(message.betAmount) || message.betAmount <= 0) return { code: Code.ERROR_PARAM, msg: 'invalid bet amount' }
        if (message.mineCell !== undefined) return { code: Code.ERROR_PARAM, msg: 'mine cell is server controlled' }
        const controlService = this.app.get('controlService') as { isGameEnabled(gameCode: string): Promise<boolean>, getGlobalBetConfig(gameCode: string): Promise<{ minBet: number, maxBet: number } | null> }
        if (!await controlService.isGameEnabled(gameCode)) {
            return { code: Code.ERROR_STATUS, msg: 'game is disabled' }
        }
        if (!message.useFreeBet) {
            const globalBetConfig = await controlService.getGlobalBetConfig(gameCode)
            if (globalBetConfig && (message.betAmount < globalBetConfig.minBet || message.betAmount > globalBetConfig.maxBet)) {
                return { code: Code.ERROR_PARAM, msg: 'bet amount is outside the configured range' }
            }
        }
        try {
            const difficulty = getPilotChickenDifficulty(message.difficulty)
            const identity = await loadPilotChickenWalletIdentity(this.userService, userId, gameCode)
            const useFreeBet = message.useFreeBet === true
            const freeBetStatus = useFreeBet ? await loadPilotChickenFreeBetStatus(identity, this.setting) : undefined
            if (useFreeBet && (!freeBetStatus || !this.canUseFreeBet(freeBetStatus))) throw new Error('free bet is unavailable')
            const betAmount = useFreeBet ? freeBetStatus.freeBetAmount : message.betAmount
            const targetRtp = await this.getTargetRtp(gameCode)
            const mineCell = this.generateMineCell(difficulty.multiplierUnits, targetRtp)
            const { snapshot, reveal } = await this.gameService.placeBetAndRevealFirstCell(userId, generatePilotChickenRoundId(), { betAmount, mineCells: mineCell === null ? new Set<number>() : new Set<number>([mineCell]), safeMultiplierUnits: difficulty.multiplierUnits }, difficulty.difficulty, createPilotChickenWallet(identity, this.setting), useFreeBet)
            this.getLogger(gameCode).info('Pilot chicken 风控信息', {
                回合ID: snapshot.roundId,
                难度: difficulty.difficulty,
                目标杀率: targetRtp === null ? null : 100 - targetRtp,
                目标RTP: targetRtp,
                风控模式: targetRtp === null ? 'uniform-random' : 'target-kill-rate',
            })
            const recentMultiplierUnits = reveal.status === ChickenRoundStatus.LOST ? await this.persistCompletedRound(userId, gameCode) : undefined
            return { code: Code.OK, data: { ...snapshot, ...reveal, balance: await loadPilotChickenBalance(identity, this.setting), freeBetAmount: freeBetStatus?.freeBetAmount, recentMultiplierUnits } }
        } catch (error) { return { code: Code.INVALID_BET, msg: this.getErrorMessage(error) } }
    }

    public async revealNextCellRequest(message: { cell: number }, session: BackendSession) {
        const userId = this.validateSession(session)
        const gameCode = this.getSessionGameCode(session)
        if (userId === null || !gameCode) return { code: Code.ERROR_PARAM, msg: 'invalid game session' }
        try { const identity = await loadPilotChickenWalletIdentity(this.userService, userId, gameCode); const data = await this.gameService.revealNextCell(userId, message.cell, createPilotChickenWallet(identity, this.setting)); const recentMultiplierUnits = data.status === ChickenRoundStatus.LOST ? await this.persistCompletedRound(userId, gameCode) : undefined; return { code: Code.OK, data: { ...this.gameService.getSnapshot(userId), ...data, balance: await loadPilotChickenBalance(identity, this.setting), recentMultiplierUnits } } }
        catch (error) { return { code: Code.ERROR_PARAM, msg: this.getErrorMessage(error) } }
    }

    public async cashOutRequest(_message: {}, session: BackendSession) {
        const userId = this.validateSession(session)
        const gameCode = this.getSessionGameCode(session)
        if (userId === null || !gameCode) return { code: Code.ERROR_PARAM, msg: 'invalid game session' }
        try {
            const { identity, cashOutResult, recentMultiplierUnits } = await this.cashOutActiveRound(userId, gameCode)
            return { code: Code.OK, data: { ...this.gameService.getSnapshot(userId), ...cashOutResult, balance: await loadPilotChickenBalance(identity, this.setting), recentMultiplierUnits } }
        } catch (error) { return { code: Code.CASH_OUT_FAIL, msg: this.getErrorMessage(error) } }
    }

    public async offline(userId: number, gameCode: string): Promise<void> {
        if (this.gameService.getSnapshot(userId).status !== ChickenRoundStatus.PLAYING) return
        await this.cashOutActiveRound(userId, gameCode)
    }

    public async betHistoryRequest(message: { page?: number, pageSize?: number }, session: BackendSession) {
        const userId = this.validateSession(session)
        const gameCode = this.getSessionGameCode(session)
        if (userId === null || !gameCode) return { code: Code.ERROR_PARAM, msg: 'invalid game session' }
        try { return { code: Code.OK, data: await this.recordService.getBetHistory(userId, gameCode, message?.page, message?.pageSize) } }
        catch (error) { return { code: Code.ERROR_PARAM, msg: this.getErrorMessage(error) } }
    }

    private async cashOutActiveRound(userId: number, gameCode: string) {
        const identity = await loadPilotChickenWalletIdentity(this.userService, userId, gameCode)
        const cashOutResult = await this.gameService.cashOut(userId, createPilotChickenWallet(identity, this.setting))
        const recentMultiplierUnits = await this.persistCompletedRound(userId, gameCode)
        return { identity, cashOutResult, recentMultiplierUnits }
    }

    private async persistCompletedRound(userId: number, gameCode: string): Promise<number[]> {
        const completedRound = this.gameService.getCompletedRound(userId)
        if (!completedRound) return []
        const identity = await loadPilotChickenWalletIdentity(this.userService, userId, gameCode)
        const recordSaved = await this.recordService.saveCompletedRound({ userId, username: identity.username, channelId: identity.channelId, gameCode, currency: '', ...completedRound })
        if (recordSaved) {
            const controlService = this.app.get('controlService') as { saveProgress(progressDelta: number, channelId: number | string, gameCode: string): Promise<unknown> }
            try {
                await controlService.saveProgress(completedRound.betAmount - completedRound.payoutAmount, identity.channelId, gameCode)
            } catch (error) {
                this.getLogger(gameCode).error('保存飞行小鸡风控进度失败', error)
            }
        }
        return this.publishMultiplier(identity.channelId, gameCode, completedRound.multiplierUnits)
    }
    private addPlayerToMultiplierChannel(channelId: string | number, gameCode: string, userId: number, session: BackendSession): void {
        const channel = this.app.channelService.getChannel(this.getMultiplierChannelName(channelId, gameCode), true)
        if (!channel.getMember(String(userId))) channel.add(String(userId), session.frontendId)
    }
    private async publishMultiplier(channelId: string | number, gameCode: string, multiplierUnits: number): Promise<number[]> {
        if (!Number.isSafeInteger(multiplierUnits) || multiplierUnits < 0) return this.getRecentMultiplierUnits(channelId, gameCode)
        this.ensureRpcInvocation()
        const recentMultiplierUnits = [multiplierUnits].concat(this.getRecentMultiplierUnits(channelId, gameCode)).slice(0, MULTIPLIER_HISTORY_LIMIT)
        this.recentMultiplierUnitsByGameKey.set(this.getGameKey(channelId, gameCode), recentMultiplierUnits)
        try {
            await this.app.channelService.getChannel(this.getMultiplierChannelName(channelId, gameCode), true).apushMessage(MULTIPLIER_EVENT_ROUTE, { multiplierUnits })
        } catch (error) {
            this.getLogger(gameCode).error('发布飞行小鸡倍率消息失败', error)
        }
        return recentMultiplierUnits
    }
    private ensureRpcInvocation(): void {
        if (typeof this.app.rpcInvoke === 'function') return
        const proxyClient = this.app.components.__proxy__?.client
        if (!proxyClient) throw new Error('Pinus RPC 代理不可用')
        this.app.rpcInvoke = proxyClient.rpcInvoke.bind(proxyClient)
    }
    private async loadRecentMultiplierUnits(channelId: string | number, gameCode: string): Promise<number[]> {
        const cachedMultiplierUnits = this.getRecentMultiplierUnits(channelId, gameCode)
        if (cachedMultiplierUnits.length > 0) return cachedMultiplierUnits
        try {
            const persistedMultiplierUnits = await this.recordService.getRecentMultiplierUnits(channelId, gameCode, MULTIPLIER_HISTORY_LIMIT)
            this.recentMultiplierUnitsByGameKey.set(this.getGameKey(channelId, gameCode), persistedMultiplierUnits)
            return persistedMultiplierUnits
        } catch (_error) {
            return []
        }
    }
    private getRecentMultiplierUnits(channelId: string | number, gameCode: string): number[] { return this.recentMultiplierUnitsByGameKey.get(this.getGameKey(channelId, gameCode)) || [] }
    private getMultiplierChannelName(channelId: string | number, gameCode: string): string { return 'pilot_chicken_multiplier_' + this.getGameKey(channelId, gameCode) }
    private getGameKey(channelId: string | number, gameCode: string): string { return String(channelId) + ':' + gameCode }

    private async loadBalance(userId: number, gameCode: string): Promise<number> {
        const identity = await loadPilotChickenWalletIdentity(this.userService, userId, gameCode)
        return loadPilotChickenBalance(identity, this.setting)
    }
    private canUseFreeBet(freeBetStatus: { remainCount: number, freeBetAmount: number }): boolean { return freeBetStatus.remainCount > 0 && freeBetStatus.freeBetAmount > 0 }
    private validateSession(session: BackendSession): number | null { const userId = Number(session.uid); return Number.isSafeInteger(userId) && userId > 0 ? userId : null }
    private getSessionGameCode(session: BackendSession): string { return this.normalizeGameCode(session.get('gameCode')) }
    private normalizeGameCode(value: unknown): string { return typeof value === 'string' ? value.trim().toLowerCase() : '' }
    private getLogger(gameCode: string) { return getLogger(gameCode === 'chicken-road2' ? 'chicken-road2' : 'pilotChicken') }
    private async getTargetRtp(gameCode: string): Promise<number | null> {
        if (!this.riskControlLoadedGameCodes.has(gameCode)) await this.reloadRiskControl(gameCode)
        return this.targetRtpByGameCode.get(gameCode) || null
    }
    private generateMineCell(multiplierUnits: readonly number[], targetRtp: number | null): number | null { return targetRtp === null ? randomInt(1, multiplierUnits.length + 1) : resolvePilotChickenMineCell(multiplierUnits, targetRtp, randomInt(0, 1_000_000) / 1_000_000) }
    private getErrorMessage(error: unknown): string { return error instanceof Error ? error.message : 'invalid request' }
}
