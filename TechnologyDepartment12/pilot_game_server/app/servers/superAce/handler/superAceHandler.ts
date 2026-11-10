import { Application, BackendSession } from "pinus";
import { Code } from "../../../consts/code";
import gameConfig, { GameConfig } from "../../../games/superAce/gameConfig";
import superAce, { SuperAce } from "../../../games/superAce";

export default function (app: Application) {
    return new SuperAceHandler(app);
}

export class SuperAceHandler {
    private _ace: SuperAce

    private _gameConfig: GameConfig
    constructor(private app: Application) {
        this._ace = superAce(app)
        this._gameConfig = gameConfig(app)
    }

    public async enterRequest(msg: { currency: string, tag: string, channelId: any }, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameCode = session.get('gameCode') as string
        console.log("------------------enterRequest----------------:",userId);
        if (!await this._ace.enter(userId, msg.tag, msg.channelId, gameCode)) {
            return { code: Code.ERROR_ENTER_GAME, msg: 'enter game fail' }
        }
        return { code: Code.OK, data: await this._ace.getContextAce(userId) }
    }

    // 玩家点击骰子 poss位置   difficulty难度
    public async betRequest(msg: { betCount: number, tag: string,auto:boolean }, session: BackendSession) {

        const userId = parseInt(session.uid)
        let user = this._ace.getUserInfo(userId);
        if (!user) {
            return { code: Code.ERROR_PARAM, msg: 'ERROR PARAM!' }
        }

        let config = await this._gameConfig.getConfigById(user.channelId);
        if (!config) {
            return { code: Code.ERROR_PARAM, msg: 'ERROR PARAM - config!' }
        }

        if (msg.betCount > config.maxBet) {
            return { code: Code.ERROR_PARAM, msg: 'Cannot be higher than the maximum value ' + (config.maxBet) / 100 + '!' }
        }
        // 校验参数
        if (msg.betCount < config.minBet) {
            return { code: Code.ERROR_PARAM, msg: 'Cannot be lower than the minimum value ' + config.minBet / 100 + '!' }
        }
   
        if (this._ace.getBet(userId)) {
            return { code: Code.ERROR_REPEAT, msg: 'repeat bet' }
        }
        // 是否有足够的钱
        if (await this._ace.getCoinLocal(userId) < msg.betCount) {
            return { code: Code.NOT_ENOUGH_COIN, msg: 'not enough coin' }
        }
        
        let betresult = await this._ace.bet(userId, msg)
        return betresult
    }


}
