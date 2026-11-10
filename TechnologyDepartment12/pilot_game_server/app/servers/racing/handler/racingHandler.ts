import {Application, BackendSession} from "pinus";
import {Code} from "../../../consts/code";
import aviator, {Aviator, STATUS} from "../../../games/aviator";
import racing, { Racing } from "../../../games/racing";
import gameConfig,{ GameConfig } from "../../../games/racing/gameConfig";

export default function(app: Application) {
    return new RacingHandler(app);
}

export class RacingHandler {
    private _racing: Racing
    private _gameConfig: GameConfig
    constructor(private app: Application) {
        this._racing = racing(app)
        this._gameConfig = gameConfig(app)
      
    }

    public async enterRequest(msg: {channelId:any }, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameCode = session.get('gameCode') as string
        //return {code: Code.OK, data: {session:session.uid,data:this._racing.getContext(userId)}}
        if (this._racing.loading(userId)) {
            return {code: Code.USER_LOADING, msg: 'error user loading'}
        }
        if (this._racing.unloading(userId)) {
            return {code: Code.USER_UNLOADING, msg: 'error user unloading'}
        }
        if (this._racing.canReconnect(userId)) {
            this._racing.reconnect(userId, gameCode)
        } else {
            if(!await this._racing.enter(userId, msg.channelId, gameCode)) {
                return {code: Code.ERROR_ENTER_GAME, msg: 'enter game fail'}
            }
        }

        let user = await this._racing.getContext(userId);
        console.log("this._racing.getContext:",user);
        return {code: Code.OK, data: user}
        //return {code: 30, obj: "服务器成功连接"}
    }

    public async getHistoryRequest(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        let user = this._racing.getUserInfo(userId);
        if(!user){
            return { code: Code.ERROR_PARAM }
        }
        return {code: Code.OK, data: this._racing.getHistroy(userId)} ;
    }

    // 玩家下注
    public async betRequest(msg: {data:{index: number, betCount: number}[],allCount:number,tag:string}, session: BackendSession) {
        
        if(msg.allCount <= 0){
            return { code: Code.ERROR_PARAM,msg:"invalid amount" }
        }
        const userId = parseInt(session.uid)
        let user = this._racing.getUserInfo(userId);
        if(!user){
            return { code: Code.ERROR_PARAM }
        }
        // 校验参数
        let config = await this._gameConfig.getConfigById(user.channelId);
        if(!config){
            return { code: Code.ERROR_PARAM }
        }

        if (msg.allCount > config.maxBet || msg.allCount < config.minBet ) {
            return { code: Code.ERROR_PARAM }
        }
        // if (msg.auto && (msg.multiple > this._gameConfig.maxMultiple || msg.multiple < this._gameConfig.minMultiple)) {
        //     return { code: Code.ERROR_PARAM }
        // }
        
        // 状态
        if(await this._racing.getStatus(userId) !== STATUS.WAIT) {
            return { code: Code.NOT_IN_BET_TIME, msg: 'not in bet time'}
        }
        // // 下注次数
        // if (this._racing.getBetCarCount(userId,msg.index)) {
        //     return {code: Code.MAX_TIMES, msg: 'Bet up to 4 cars'}
        // }
        // 是不是updating中
        if (this._racing.updating(userId)) {
            return {code: Code.INVALID_BET, msg: 'invalid bet updating'}
        }
        //重复下注
        if (this._racing.getBet(userId)) {
            return {code: Code.ERROR_REPEAT, msg: 'repeat bet'}
        }
        // 是否有足够的钱
        if (this._racing.getCoin(userId) < msg.allCount) {
            return {code: Code.NOT_ENOUGH_COIN, msg: 'not enough coin'}
        }
        
        if(!await this._racing.betCar(userId, msg.data,msg.tag)) {
            return {code: Code.INVALID_BET, msg: 'invalid bet betCar'}
        }
        return {code: Code.OK, data: {coin: this._racing.getCoin(userId)}}
    }
    // 取消下注
    public async cancelRequest(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        if (await this._racing.getStatus(userId) !== STATUS.WAIT) {
            return {code: Code.ERROR_STATUS, msg: 'time out!!!'}
        }
        if(!await this._racing.cancel(userId)) {
            return {code: Code.BET_NOT_FOUND,msg:"bet not found"}
        }
        return {code: Code.OK, data: {coin: this._racing.getCoin(userId)}}
    }
    // cashout
    public async cashOutRequest(msg: {index: number}, session: BackendSession) {
        // const userId = parseInt(session.uid)
        // if (await this._racing.getStatus(userId) !== STATUS.GAME) {
        //     return {code: Code.ERROR_STATUS, msg: 'time out!!!'}
        // }
        // const {success,multiple, cashOut} = this._racing.cashOut(userId, msg.index)
        // if (!success) {
        //     return { code: Code.CASH_OUT_FAIL}
        // } else {
        //     return { code: Code.OK, data: { multiple: multiple, cashOut: cashOut, coin: this._racing.getCoin(userId) } }
        // }
    }

    // cashout
    public async refreshViewdataRequest(msg: {}, session: BackendSession) {  
        const userId = parseInt(session.uid)
        // if (this._racing.status !== STATUS.GAME) {
        //     return {code: Code.ERROR_STATUS, msg: 'time out!!!'}
        // }
        // const {success,multiple, cashOut} = this._racing.cashOut(userId, msg.index)
        // if (!success) {
        //     return { code: Code.CASH_OUT_FAIL}
        // } else {
        //     return { code: Code.OK, data: { multiple: multiple, cashOut: cashOut, coin: this._racing.getCoin(userId) } }
        // }
        let gameInfo = await this._racing.getContext(userId);
        return { code: Code.OK, data: gameInfo }
    }
}
