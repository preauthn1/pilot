import { Application, BackendSession } from "pinus";
import { Code } from "../../../consts/code";
import tiger, { Tiger } from "../../../games/tiger";
import tigerConfig, { TigerConfig } from "../../../games/tiger/tigerConfig";

export default function (app: Application) {
    return new tigerHandler(app);
}

export class tigerHandler {

    private _tiger: Tiger;
    private _gameConfig: TigerConfig;
    constructor(app: Application) {
        this._tiger = tiger(app);
        this._gameConfig = tigerConfig(app);
    }

    public async enterRequest(msg: { channelId: any }, session: BackendSession) {
        const userId = parseInt(session.uid);
        const gameCode = session.get('gameCode') as string
        let data = null;
        if (this._tiger.canReconnect(userId)) {
            this._tiger.reconnect(userId, gameCode)
        } else {
            data = await this._tiger.enter(userId, msg.channelId, gameCode)
            if (!data) {
                return { code: Code.ERROR_ENTER_GAME, msg: 'enter game fail' }
            }
        }

        // let user = this._tiger.getContext(userId);
        // let obj = {
        //     coin: user.userInfo.coin,
        //     username: user.userInfo.username
        // }
        //session.
        return { code: Code.OK, data: data }
    }

    public async getBalanceRequest(msg: { channelId: any }, session: BackendSession) {
        const userId = parseInt(session.uid);
        const coin = await this._tiger.getBalance(userId, msg.channelId);
        //session.
        if (isNaN(coin)) {
            return { code: Code.MAX_TIMES, data: 0 }
        } else {
            return { code: Code.OK, data: coin }
        }

    }

    public async turbo(msg: { channelId: any }, session: BackendSession) {
        const userId = parseInt(session.uid);
        const turBoObj = this._tiger.turbo(userId)
        return { code: turBoObj.success ? Code.OK : Code.ERROR_STATUS, isFast: turBoObj.isFast }
    }

    userOffLine(userId: number) {
        let user = this._tiger.getContext(userId);
        console.log('玩家掉线', user);
    }

    // 玩家下注
    public async betRequest(msg: { data: { auto: boolean, amount: number, count: number, win_threshold: number, lose_threshold: number, win_threshold_percentage: number, lose_threshold_percentage: number}, tag: string, type: string, level: number  }, session: BackendSession) {
        //{auto: boolean, amount: number,count: number,win_threshold: number,lose_threshold: number, win_threshold_percentage: number,lose_threshold_percentage: number}

        //校验参数
        const userId = parseInt(session.uid)
        let user = this._tiger.getUserInfo(userId);

        if (msg.data.amount <= 0) {
            return { code: Code.ERROR_PARAM, msg: "invalid amount" }
        }

        if (!user) {
            return { code: Code.ERROR_PARAM }
        }
        let config = await this._gameConfig.getConfigById(user.channelId);
        if (!config) {
            return { code: Code.ERROR_PARAM }
        }
        //console.log("config:",config);
        
        // 校验参数
        if (msg.data.amount > config.maxBet || msg.data.amount < config.minBet) {
            return { code: Code.ERROR_PARAM }
        }

        // if(!this._tiger.running){
        //     return {code: Code.INVALID_BET, msg: 'Game In Maintenance'}
        // }

        // 是不是updating中
        if (this._tiger.updating(userId)) {
            return { code: Code.INVALID_BET, msg: 'invalid bet' }
        }
        //重复下注
        if (!this._tiger.getBet(userId)) {
            this._tiger.deleteBetInfoById(userId);
            return { code: Code.ERROR_REPEAT, msg: 'repeat bet' }
        }
        // 是否有足够的钱
        if (this._tiger.getCoin(userId) < msg.data.amount) {
            return { code: Code.NOT_ENOUGH_COIN, msg: 'not enough coin' }
        }
        // if(!await this._tiger.betCar(userId, msg.data,msg.tag)) {
        //     return {code: Code.INVALID_BET, msg: 'invalid bet'}
        // }
        // return {code: Code.OK, data: {coin: this._tiger.getCoin(userId)}}
        if (this._tiger.bet(userId, msg)) {
            return { code: Code.OK, data: '下注成功' }
        } else {
            return { code: Code.INVALID_BET, msg: 'wait.....' }
        }

    }

    // 取消下注
    public async cancelRequest(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        if (!this._tiger.getBet(userId)) {
            return { code: Code.BET_NOT_FOUND, msg: 'BET NOT FOUND' }
        }
        if (!await this._tiger.cancel(userId)) {
            return { code: Code.BET_NOT_FOUND }
        }
        return { code: Code.OK, data: { coin: this._tiger.getCoin(userId) } }
    }

}
