import { Application, BackendSession } from "pinus";
import { Code } from "../../../consts/code";
import { STATUS } from "../../../games/aviator";
import jump, { Jump } from "../../../games/jump";
import jumpConfig, { JumpConfig } from "../../../games/jump/JumpConfig";

export default function (app: Application) {
    return new JumpHandler(app);
}

export class JumpHandler {

    private _jump: Jump;
    private _gameConfig: JumpConfig;
    constructor(app: Application) {
        this._jump = jump(app);
        this._gameConfig = jumpConfig(app);
    }

    public async enterRequest(msg: { currency: string, tag: string, channelId: any }, session: BackendSession) {
        const userId = parseInt(session.uid);
        const gameCode = session.get('gameCode') as string

        if (this._jump.canReconnect(userId)) {
            this._jump.reconnect(userId, gameCode)
        } else {
            if (!await this._jump.enter(userId, msg.channelId, gameCode)) {
                return { code: Code.ERROR_ENTER_GAME, msg: 'enter game fail' }
            }
        }

        let user = this._jump.getContext(userId);
        let obj = {
            coin: user.userInfo.coin,
            username: user.userInfo.username,
            userId: user.userInfo.userId
        }
        //session.
        return { code: Code.OK, data: obj }
    }



    userOffLine(userId: number) {
        let user = this._jump.getContext(userId);
        console.log('玩家掉线', user);
    }

    testPirate(msg: { first: number, scen: number }) {
        //this._jump.testPirate(msg);
        //return { code: Code.OK,msg:"true" }
    }

    // 玩家下注
    public async betRequest(msg: { index: number, betCount: number, auto: boolean, multiple: number, tag: string }, session: BackendSession) {
        // 校验参数
        const userId = parseInt(session.uid)
        let user = this._jump.getUserInfo(userId);
        let room = this._jump.getChannelRoom(userId);
        if (!user) {
            return { code: Code.ERROR_PARAM, msg: "Please login again" }
        }
        let config = await this._gameConfig.getConfigById(user.channelId);

        if (!config) {
            return { code: Code.ERROR_PARAM, msg: "Please try again later" }
        }

        // 校验参数
        if (msg.betCount > config.maxBet || msg.betCount < config.minBet) {
            return { code: Code.ERROR_PARAM, msg: "Invalid script settings" }
        }
        if (msg.auto && (msg.multiple > config.maxMultiple || msg.multiple < config.minMultiple)) {
            return { code: Code.ERROR_PARAM, msg: "Invalid script settings" }
        }

        // 状态
        if (room.status !== STATUS.WAIT) {
            return { code: Code.ERROR_STATUS, msg: 'not in bet time' }
        }
        // 下注次数
        if (this._jump.betTimes(userId) >= 2) {
            return { code: Code.MAX_TIMES, msg: 'bet max times' }
        }
        // 是不是updating中
        if (this._jump.updating(userId)) {
            return { code: Code.INVALID_BET, msg: 'invalid bet' }
        }
        if (this._jump.getBet(userId, msg.index)) {
            return { code: Code.ERROR_REPEAT, msg: 'repeat bet' }
        }
        // 是否有足够的钱
        if (this._jump.getCoin(userId) < msg.betCount) {
            return { code: Code.NOT_ENOUGH_COIN, msg: 'not enough coin' }
        }
        if (!await this._jump.bet(userId, msg.index, msg.betCount, msg.auto, msg.multiple, msg.tag)) {
            return { code: Code.INVALID_BET, msg: 'invalid bet' }
        }
        return { code: Code.OK, data: { coin: this._jump.getCoin(userId) } }
    }


    // 结算
    public async cashOutRequest(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        let room = this._jump.getChannelRoom(userId);
        if (!this._jump.getBet(userId, 0)) {
            return { code: Code.BET_NOT_FOUND, msg: 'BET NOT FOUND' }
        }

        // 状态
        if (room.status !== STATUS.GAME) {
            return { code: Code.ERROR_STATUS, msg: 'not in gaming time' }
        }

        let cash = await this._jump.cashOut(userId, 0);//{ success: true, multiple: multiple, cashOut: reward }
        if (!cash.success) {
            return { code: Code.BET_NOT_FOUND, msg: 'BET NOT FOUND' }
        }

        

        return {
            code: Code.OK, data: {
                coin: this._jump.getCoin(userId),
                settle: cash.cashOut,
                mult: cash.multiple
            }
        }
    }

    // 退出
    public async cancelRequest(msg: { index: number }, session: BackendSession) {
        const userId = parseInt(session.uid)
        //let user = this._jump.getUserInfo(userId);
        let room = this._jump.getChannelRoom(userId);
        if (room.status !== STATUS.WAIT) {
            return { code: Code.ERROR_STATUS, msg: 'time out!!!' }
        }
        if (!await room.cancel(userId, msg.index)) {
            return { code: Code.BET_NOT_FOUND, msg: 'BET NOT FOUND' }
        }
        return { code: Code.OK, data: { coin: this._jump.getCoin(userId) } }
    }
    // // 取消下注
    // public async failRequest(msg: {}, session: BackendSession) {
    //     const userId = parseInt(session.uid)
    //     if (!this._jump.getBet(userId)) {
    //         return { code: Code.BET_NOT_FOUND, msg: 'BET NOT FOUND' }
    //     }
    //     if (!await this._jump.cancel(userId)) {
    //         return { code: Code.BET_NOT_FOUND }
    //     }
    //     return { code: Code.OK, data: { coin: this._jump.getCoin(userId) } }
    // }

}
