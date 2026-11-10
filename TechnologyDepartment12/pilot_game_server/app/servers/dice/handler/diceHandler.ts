import { Application, BackendSession } from "pinus";
import { Code } from "../../../consts/code";
import dice, { Dice } from "../../../games/dice";
import gameConfig, { GameConfig } from "../../../games/dice/gameConfig";

export default function (app: Application) {
    return new DiceHandler(app);
}

export class DiceHandler {
    private _dice: Dice

    private _gameConfig: GameConfig
    constructor(private app: Application) {
        this._dice = dice(app)
        this._gameConfig = gameConfig(app)
    }

    public async enterRequest(msg: { currency: string, tag: string, channelId: any }, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameCode = session.get('gameCode') as string
        if (!await this._dice.enter(userId, msg.tag, msg.channelId, gameCode)) {
            return { code: Code.ERROR_ENTER_GAME, msg: 'enter game fail' }
        }

        // if (this._dice.canReconnect(userId)) {
        //     this._dice.reconnect(userId, msg.tag)
        // } else {
        //     if (!await this._dice.enter(userId, msg.tag)) {
        //         return { code: Code.ERROR_ENTER_GAME, msg: 'enter game fail' }
        //     }
        // }
        return { code: Code.OK, data: await this._dice.getContextDice(userId) }
    }

    // 玩家点击骰子
    public async betRequest(msg: { betCount: number, rollUnder: number, payout: number, isZF: boolean }, session: BackendSession) {

        const userId = parseInt(session.uid)
        let user = this._dice.getUserInfo(userId);
        if (!user) {
            return { code: Code.ERROR_PARAM }
        }

        let config = await this._gameConfig.getConfigById(user.channelId);
        if (!config) {
            return { code: Code.ERROR_PARAM }
        }

        if (msg.betCount > config.maxBet) {
            return { code: Code.ERROR_PARAM, msg: 'Cannot be higher than the maximum value ' + (config.maxBet) / 100 + '!' }
        }
        // 校验参数
        if (msg.betCount < config.minBet) {
            return { code: Code.ERROR_PARAM, msg: 'Cannot be lower than the minimum value ' + config.minBet / 100 + '!' }
        }
        if (msg.rollUnder < 2 || msg.rollUnder > 98) {
            return { code: Code.ERROR_PARAM, msg: 'The value of rollUnder is incorrect!' }
        }

        if (this._dice.getBet(userId)) {
            return { code: Code.ERROR_REPEAT, msg: 'repeat bet' }
        }
        // 是否有足够的钱
        if (await this._dice.getCoinLocal(userId) < msg.betCount) {
            return { code: Code.NOT_ENOUGH_COIN, msg: 'not enough coin' }
        }
        if (!await this._dice.bet(userId, msg.betCount)) {
            return { code: Code.INVALID_BET, msg: 'invalid bet' }
        }
        return { code: Code.OK, data: { data: await this._dice.cashOut(userId, msg.rollUnder, msg.payout, msg.isZF) } }
    }


}
