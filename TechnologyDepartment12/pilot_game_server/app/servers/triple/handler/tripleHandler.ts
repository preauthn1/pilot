import { Application, BackendSession } from "pinus";
import { Code } from "../../../consts/code";
import triple, { Triple } from "../../../games/triple";
import gameConfig, { GameConfig } from "../../../games/triple/gameConfig";

export default function (app: Application) {
    return new TripleHandler(app);
}

export class TripleHandler {
    private _triple: Triple

    private _gameConfig: GameConfig
    constructor(private app: Application) {
        this._triple = triple(app)
        this._gameConfig = gameConfig(app)
    }

    public async enterRequest(msg: { currency: string, tag: string,channelId:any  }, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameCode = session.get('gameCode') as string

        if (!await this._triple.enter(userId, msg.tag, msg.channelId, gameCode)) {
            return { code: Code.ERROR_ENTER_GAME, msg: 'enter game fail' }
        }
        return { code: Code.OK, data: await this._triple.getContextDice(userId) }
    }

    // 玩家点击骰子 poss位置   difficulty难度
    public async betRequest(msg: { betCount: number, poss: number[], risk: number,tag:string }, session: BackendSession) {
        
        const userId = parseInt(session.uid)
        let user = this._triple.getUserInfo(userId);
        if (!user) {
            return { code: Code.ERROR_PARAM ,msg: 'ERROR PARAM!'}
        }

        let config = await this._gameConfig.getConfigById(user.channelId);
        if (!config) {
            return { code: Code.ERROR_PARAM,msg: 'ERROR PARAM!' }
        }

        if (msg.betCount > config.maxBet) {
            return { code: Code.ERROR_PARAM, msg: 'Cannot be higher than the maximum value ' + (config.maxBet) / 100 + '!' }
        }
        // 校验参数
        if (msg.betCount < config.minBet) {
            return { code: Code.ERROR_PARAM, msg: 'Cannot be lower than the minimum value ' + config.minBet / 100 + '!' }
        }
        let possLength = msg.poss.length
        if (msg.risk < 0 || msg.risk > 3 || possLength != 3) {
            return { code: Code.ERROR_PARAM, msg: 'ERROR PARAM!' }
        }
        if (this._triple.getBet(userId)) {
            return { code: Code.ERROR_REPEAT, msg: 'repeat bet' }
        }
        // 是否有足够的钱
        if (await this._triple.getCoinLocal(userId) < msg.betCount) {
            return { code: Code.NOT_ENOUGH_COIN, msg: 'not enough coin' }
        }
        let betresult = await this._triple.bet(userId, msg.betCount, msg.risk, msg.poss,msg.tag)
        return betresult
    }


}
