import { Application, BackendSession } from "pinus";
import { Code } from "../../../consts/code";
import aviator, { Aviator, STATUS } from "../../../games/aviator";
import gameConfig, { GameConfig } from "../../../games/aviator/gameConfig";
import { multiple } from "../../../games/aviator/algorithm";

export default function (app: Application) {
    return new AviatorHandler(app);
}

export class AviatorHandler {
    private _aviator: Aviator
    private _gameConfig: GameConfig
    private readonly _userOperationQueues = new Map<string, Promise<void>>()
    constructor(private app: Application) {
        this._aviator = aviator(app)
        this._gameConfig = gameConfig(app)
    }

    public async enterRequest(msg: { channelId: any, tag?: string }, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameCode = session.get('gameCode') as string
        return this.runUserOperation(userId, gameCode, async () => {
            console.log("enterRequest:",msg);

            if (this._aviator.loading(userId)) {
                return { code: Code.USER_LOADING, msg: 'error user loading' }
            }
            if (this._aviator.unloading(userId)) {
                return { code: Code.USER_UNLOADING, msg: 'error user unloading' }
            }
            if (!gameCode) {
                return { code: Code.ERROR_PARAM, msg: 'gameCode is required' }
            }
            if (this._aviator.canReconnect(userId, gameCode)) {
                this._aviator.reconnect(userId, gameCode)
            } else if (!await this._aviator.enter(userId, msg, gameCode)) {
                return { code: Code.ERROR_ENTER_GAME, msg: 'enter game fail' }
            }
            return { code: Code.OK, data: this._aviator.getContext(userId, gameCode) }
        })
    }

    // 玩家下注
    public async betRequest(msg: { index: number, betCount: number, auto: boolean, multiple: number, tag: string, useFreeBet?: boolean, roundKey?: string }, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameCode = session.get('gameCode') as string
        return this.runUserOperation(userId, gameCode, async () => {
            const controlService = this.app.get('controlService') as { isGameEnabled(gameCode: string): Promise<boolean>, getGlobalBetConfig(gameCode: string): Promise<{ minBet: number, maxBet: number } | null> }
            let room = this._aviator.getChannelRoom(userId, gameCode);
            if (!room) {
                return { code: Code.ERROR_ENTER_GAME, msg: 'game room not found' }
            }
            const roundKey = typeof msg.roundKey === 'string' && msg.roundKey ? msg.roundKey : room.roundKey
            if (!room.bettingOpen || roundKey !== room.roundKey) {
                return { code: Code.ERROR_STATUS, msg: 'not in bet time' }
            }
            if (this._aviator.betTimes(userId, gameCode) >= 2) {
                return { code: Code.MAX_TIMES, msg: 'bet max times' }
            }
            if (this._aviator.updating(userId)) {
                return { code: Code.INVALID_BET, msg: 'invalid bet' }
            }
            if(!this._aviator.settleCompleted(userId,msg.index, gameCode)){
                return { code: Code.INVALID_BET, msg: 'There is still unfinished settlement' }
            }
            if (this._aviator.getBet(userId, msg.index, gameCode)) {
                return { code: Code.ERROR_REPEAT, msg: 'repeat bet' }
            }

            let user = this._aviator.getUserInfo(userId, gameCode);
            if(!user){
                return { code: Code.ERROR_PARAM }
            }
            const [gameEnabled, config, globalBetConfig] = await Promise.all([
                controlService.isGameEnabled(gameCode),
                this._gameConfig.getConfigById(user.channelId),
                controlService.getGlobalBetConfig(gameCode),
            ])
            if (!gameEnabled) {
                return { code: Code.ERROR_STATUS, msg: 'game is disabled' }
            }
            if(!config){
                return { code: Code.ERROR_PARAM}
            }
            if (!room.bettingOpen || room.roundKey !== roundKey) {
                return { code: Code.ERROR_STATUS, msg: 'not in bet time' }
            }
            const minBet = globalBetConfig?.minBet ?? config.minBet
            const maxBet = globalBetConfig?.maxBet ?? config.maxBet

            const betCount = Number(msg.betCount)
            const autoCashOutMultiple = Number(msg.multiple)
            if (!Number.isFinite(betCount) || betCount > maxBet || betCount < minBet) {
                return { code: Code.ERROR_PARAM, msg: "Wrong bet amount" }
            }
            if (msg.auto && (!Number.isFinite(autoCashOutMultiple) || autoCashOutMultiple > config.maxMultiple || autoCashOutMultiple < config.minMultiple)) {
                return { code: Code.ERROR_PARAM, msg: "Wrong bet amount" }
            }
            if (!msg.useFreeBet && this._aviator.getCoin(userId, gameCode) < betCount) {
                return { code: Code.NOT_ENOUGH_COIN, msg: 'not enough coin' }
            }
            if (!await this._aviator.bet(userId, msg.index, betCount, msg.auto, autoCashOutMultiple, msg.tag, gameCode, { useFreeBet: !!msg.useFreeBet, roundKey })) {
                return { code: Code.INVALID_BET, msg: 'invalid bet' }
            }
            return { code: Code.OK, data: { coin: this._aviator.getCoin(userId, gameCode) } }
        })
    }

    private async runUserOperation<T>(userId: number, gameCode: string, operation: () => Promise<T>): Promise<T> {
        const key = `${userId}:${gameCode}`
        const previous = this._userOperationQueues.get(key) ?? Promise.resolve()
        let release: () => void = () => undefined
        const current = new Promise<void>(resolve => {
            release = resolve
        })
        const queue = previous.then(() => current)
        this._userOperationQueues.set(key, queue)
        await previous
        try {
            return await operation()
        } finally {
            release()
            if (this._userOperationQueues.get(key) === queue) {
                this._userOperationQueues.delete(key)
            }
        }
    }

    public async updateAutoCashOutRequest(msg: { index: number, auto: boolean, multiple: number }, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameCode = session.get('gameCode') as string
        let room = this._aviator.getChannelRoom(userId, gameCode);
        if (room.status !== STATUS.GAME) {
            return { code: Code.ERROR_STATUS, msg: 'time out!!!' }
        }
        let user = this._aviator.getUserInfo(userId, gameCode);
        if (!user) {
            return { code: Code.ERROR_PARAM }
        }
        let config = await this._gameConfig.getConfigById(user.channelId);
        if (!config) {
            return { code: Code.ERROR_PARAM }
        }
        const multiple = Number(msg.multiple)
        if (msg.auto && (!Number.isFinite(multiple) || multiple > config.maxMultiple || multiple < config.minMultiple)) {
            return { code: Code.ERROR_PARAM, msg: "Wrong bet amount" }
        }

        const result = await this._aviator.updateAutoCashOut(userId, msg.index, msg.auto, multiple, gameCode)
        const { success, settled, multiple: settledMultiple, cashOut } = result
        if (!success) {
            return { code: Code.INVALID_BET, msg: 'invalid bet' }
        }
        return { code: Code.OK, data: { settled, multiple: settledMultiple, cashOut, coin: this._aviator.getCoin(userId, gameCode) } }
    }

    public async cancelRequest(msg: { index: number }, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameCode = session.get('gameCode') as string
        let room = this._aviator.getChannelRoom(userId, gameCode);
        if (room.status !== STATUS.WAIT) {
            return { code: Code.ERROR_STATUS, msg: 'time out!!!' }
        }
        if (!await this._aviator.cancel(userId, msg.index, gameCode)) {
            return { code: Code.BET_NOT_FOUND }
        }
        return { code: Code.OK, data: { coin: this._aviator.getCoin(userId, gameCode) } }
    }
    // cashout
    public async cashOutRequest(msg: { index: number }, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameCode = session.get('gameCode') as string
        let room = this._aviator.getChannelRoom(userId, gameCode);
        if (room.status !== STATUS.GAME) {
            return { code: Code.ERROR_STATUS, msg: 'time out!!!' }
        }
        const { success, multiple, cashOut } = await this._aviator.cashOut(userId, msg.index, gameCode)
        if (!success) {
            return { code: Code.CASH_OUT_FAIL }
        } else {
            return { code: Code.OK, data: { multiple: multiple, cashOut: cashOut, coin: this._aviator.getCoin(userId, gameCode) } }
        }
    }
}
