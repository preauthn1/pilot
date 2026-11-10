import { Application, BackendSession } from "pinus";
import { Code } from "../../../consts/code";
import mines, { Mines } from "../../../games/mines";
import gameConfig, { GameConfig } from "../../../games/mines/gameConfig";

export default function (app: Application) {
   
    return new MinesHandler(app);
}

export class MinesHandler {
    private _mines: Mines

    private _gameConfig: GameConfig
    constructor(private app: Application) {
        this._mines = mines(app)
        this._gameConfig = gameConfig(app)
      
    }

    public async enterRequest(msg: { currency: string, tag: string, channelId: any }, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameCode = session.get('gameCode') as string
        //  console.log("mines登录：", msg);

        if (!await this._mines.enter(userId, msg.tag, msg.channelId, gameCode)) {
            return { code: Code.ERROR_ENTER_GAME, msg: 'enter game fail' }
        }
        return { code: Code.OK, data: await this._mines.getContextMines(userId) }
    }

    // 玩家下注
    public async betRequest(msg: { betCount: number, mines: number, isAuto: boolean}, session: BackendSession) {
        //  console.log("betRequest:",msg);

        const userId = parseInt(session.uid)
        let user = this._mines.getUserInfo(userId);
        if (!user) {
            return { code: Code.ERROR_PARAM }
        }

        let config = await this._gameConfig.getConfigById(user.channelId);
        if (!config) {
            return { code: Code.ERROR_PARAM }
        }

        // 校验参数
        if (msg.betCount > config.maxBet || msg.betCount < config.minBet) {
            return { code: Code.ERROR_PARAM }
        }
        // 是否有足够的钱
        if (await this._mines.getCoin(userId) < msg.betCount) {
            return { code: Code.NOT_ENOUGH_COIN, msg: 'not enough coin' }
        }
        if (!await this._mines.bet(userId, msg.betCount, msg.mines)) {
            return { code: Code.INVALID_BET, msg: 'invalid bet' }
        }
        let coin = await this._mines.getCoin(userId)
        return { code: Code.OK, data: { coin: coin } }
    }

    // 玩家点击
    public async clickMinesRequest(msg: { clickPos: number}, session: BackendSession) {
        const userId = parseInt(session.uid);
        let result = await this._mines.inspectMapPos(msg.clickPos, userId)
        console.log("clickMinesRequest:", msg.clickPos, result);
        if (!result.success) {
            return { code: Code.ERROR_PARAM, data: 'ERROR_PARAM' }
        }
        this._mines.resultToUser(userId)
        return { code: Code.OK, data: result.length }
        // 校验玩家传过来的位置 返回数据
    }

    // 自动下注
    public async minesAutoBetRequest(msg: {
        betCount: number, mines: number, clicks: number[], count: number, channelId: string | number
    }, session: BackendSession) {

        const userId = parseInt(session.uid)
        let user = this._mines.getUserInfo(userId);
        if (!user) {
            return { code: Code.ERROR_PARAM }
        }

        let config = await this._gameConfig.getConfigById(user.channelId);
        if (!config) {
            return { code: Code.ERROR_PARAM }
        }

        // 校验参数
        if (msg.betCount > config.maxBet || msg.betCount < config.minBet) {
            return { code: Code.ERROR_PARAM }
        }
        // 是否有足够的钱
        if (await this._mines.getCoin(userId) < msg.betCount) {
            return { code: Code.NOT_ENOUGH_COIN, msg: 'not enough coin' }
        }
        if (!await this._mines.autoBet(userId, msg.betCount, msg.mines, msg.clicks, msg.count)) {
            return { code: Code.INVALID_BET, msg: 'invalid bet' }
        }
        //console.log("cashOutMines收到请求:",msg.count);
        const cash = await this._mines.cashOutMines(userId)

        if (!cash) {
            return { code: Code.CASH_OUT_FAIL, msg: "minesAutoBetRequest" }
        } else {
            //console.log("cashOutMines处理完毕:",msg.count);
            return {
                code: Code.OK, data:
                    this._mines.resultToUser(userId)
            }
        }
    }

    // 退出
    public async cancelRequest(msg: { channelId: string | number }, session: BackendSession) {
        const userId = parseInt(session.uid)
        let { success, coin } = await this._mines.cancel(userId);
        if (!success) {
            return { code: Code.BET_NOT_FOUND, coin: coin }
        } else {
            return { code: Code.OK, coin: coin }
        }
    }

    // cashout
    public async cashOutMinesRequest(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        const cash = this._mines.cashOutMines(userId);

        if (!cash) {
            return { code: Code.CASH_OUT_FAIL, msg: "cashOutMinesRequest" }
        } else {
            //保存玩家战绩
            return { code: Code.OK, data: this._mines.resultToUser(userId)}
        }
    }

}
