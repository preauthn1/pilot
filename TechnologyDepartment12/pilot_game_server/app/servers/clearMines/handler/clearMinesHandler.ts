import { Application, BackendSession } from "pinus";
import { Code } from "../../../consts/code";
import clearMines, { ClearMines } from "../../../games/clearMines";
import clearMinesConfig, { ClearMinesConfig } from "../../../games/clearMines/ClearMinesConfig";

export default function (app: Application) {
    return new clearMinesHandler(app);
}

export class clearMinesHandler {

    private _clearMines: ClearMines;
    private _gameConfig: ClearMinesConfig;
    constructor(app: Application) {
        this._clearMines = clearMines(app);
        this._gameConfig = clearMinesConfig(app);
        console.log("$$$$$$$$$$$$###########34234234523523$$$$$$$$$$$$$$$$$$$$$$ clearMinesHandler 启动");
    }

    public async enterRequest(msg: { currency: string, tag: string, channelId: any }, session: BackendSession) {
        const userId = parseInt(session.uid);
        const gameCode = session.get('gameCode') as string
        let data = null;
        if (this._clearMines.canReconnect(userId)) {
            this._clearMines.reconnect(userId, gameCode)
        } else {
            data = await this._clearMines.enter(userId, msg.tag, msg.channelId, gameCode)
            if (!data) {
                return { code: Code.ERROR_ENTER_GAME, msg: 'enter game fail' }
            }
        }

        let user = this._clearMines.getContext(userId);

        let obj = {
            coin: user.coin,
            username: user.username
        }
        //session.
        return { code: Code.OK, data: obj }
    }

    public async getBalanceRequest(msg: { channelId: any }, session: BackendSession) {
        const userId = parseInt(session.uid);
        const coin = await this._clearMines.getBalance(userId, msg.channelId);
        //session.
        if (isNaN(coin)) {
            return { code: Code.MAX_TIMES, data: 0 }
        } else {
            return { code: Code.OK, data: coin }
        }

    }

    public async turbo(msg: { channelId: any }, session: BackendSession) {
        //const userId = parseInt(session.uid);
        //const turBoObj = this._clearMines.turbo(userId)
        return { code: Code.OK }
    }

    userOffLine(userId: number) {
        let user = this._clearMines.getContext(userId);
        console.log('玩家掉线', user);
    }


    // 玩家下注
    public async betRequest(msg: { betCount: number, mines: number, isAuto: boolean }, session: BackendSession) {
        //{auto: boolean, amount: number,count: number,win_threshold: number,lose_threshold: number, win_threshold_percentage: number,lose_threshold_percentage: number}

        //校验参数
        const userId = parseInt(session.uid)
        let user = this._clearMines.getUserInfo(userId);

        if (msg.betCount <= 0) {
            //    console.log("   新扫雷   enterRequest：----msg.betCount <= 0",user);
            return { code: Code.ERROR_PARAM, msg: "invalid amount" }
        }

        if (!user) {
            //   console.log("   新扫雷   enterRequest：----!user",user);
            return { code: Code.ERROR_PARAM }
        }
        let config = await this._gameConfig.getConfigById(user.channelId);
        if (!config) {
            //   console.log("   新扫雷   enterRequest：----!config",user);
            return { code: Code.ERROR_PARAM }
        }

        // 校验参数
        if (msg.betCount > config.maxBet || msg.betCount < config.minBet) {
            //   console.log("   新扫雷   enterRequest：-----maxBet",user);
            return { code: Code.ERROR_PARAM }
        }

        // if(!this._clearMines.running){
        //     return {code: Code.INVALID_BET, msg: 'Game In Maintenance'}
        // }

        // 是不是updating中
        // if (this._clearMines.updating(userId)) {
        //     //    console.log("   新扫雷   enterRequest：----updating",user);
        //     return { code: Code.INVALID_BET, msg: 'invalid bet' }
        // }
        //重复下注
        if (this._clearMines.getbetInfo(userId) >= 0) {
            //  console.log("   新扫雷   enterRequest：----repeat bet",user);
            this._clearMines.spliceBetInfoByUserID(userId);
            return { code: Code.ERROR_REPEAT, msg: 'repeat bet' }
        }
        // 是否有足够的钱
        if (this._clearMines.getCoin(userId) < msg.betCount) {
            //   console.log("   新扫雷   enterRequest：----not enough coin",user);
            return { code: Code.NOT_ENOUGH_COIN, msg: 'not enough coin' }
        }
        // if(!await this._clearMines.betCar(userId, msg.data,msg.tag)) {
        //     return {code: Code.INVALID_BET, msg: 'invalid bet'}
        // }
        // return {code: Code.OK, data: {coin: this._clearMines.getCoin(userId)}}
        if (!await this._clearMines.bet(userId, msg.betCount, msg.mines,false)) {
            //  console.log("   新扫雷   enterRequest：---invalid bet",user);
            return { code: Code.INVALID_BET, msg: 'Network abnormality, please refresh and try again' }
        }
        let coin = await this._clearMines.getCoin(userId)
        //  console.log("   新扫雷   enterRequest：--success",user);
        return { code: Code.OK, data: { coin: coin } }

    }

    // 玩家点击
    public async clickMinesRequest(msg: { clickPos: number }, session: BackendSession) {
        const userId = parseInt(session.uid);
        const userInfo = this._clearMines.getUserInfo(userId)
        let result = await this._clearMines.clickMinesHandler(msg.clickPos, userId, userInfo.channelId)
        if (!result.success) {
   
            return { code: Code.ERROR_PARAM, data: 'ERROR_PARAM' }
        }
    
        return { code: Code.OK, data: result.length }
        // 校验玩家传过来的位置 返回数据
        //mines.minesHandler.enterRequest
    }

    // cashout
    public async cashOutMinesRequest(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        const cash = await this._clearMines.cashOutMines(userId,false);

        if (!cash) {
   
            return { code: Code.CASH_OUT_FAIL, msg: "cashOutMinesRequest" };
        } else {
        
            return { code: Code.OK, data: cash }
        }
    }

    // 取消下注
    public async cancelRequest(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        if (this._clearMines.getbetInfo(userId) < 0) {
            return { code: Code.BET_NOT_FOUND, msg: 'BET NOT FOUND' }
        }
        this._clearMines.cannelBet(userId);
        return { code: Code.OK, data: { coin: this._clearMines.getCoin(userId) } }
    }

    // 取消下注
    public async autoBetRequest(msg: { betCount: number, mines: number, clicks: number[] }, session: BackendSession) {
        const userId = parseInt(session.uid)
        let user = this._clearMines.getUserInfo(userId);

        if (msg.betCount <= 0) {
            return { code: Code.ERROR_PARAM, msg: "invalid amount" }
        }

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
        //重复下注
        //console.log("repeat bet:",this._clearMines.getbetInfo(userId));
        
        if (this._clearMines.getbetInfo(userId) >= 0) {
            //  console.log("   新扫雷   enterRequest：----repeat bet",user);
            this._clearMines.spliceBetInfoByUserID(userId);
            return { code: Code.ERROR_REPEAT, msg: 'repeat bet' }
        }
        // 是否有足够的钱
        if (this._clearMines.getCoin(userId) < msg.betCount) {
            return { code: Code.NOT_ENOUGH_COIN, msg: 'not enough coin' }
        }

        if(await this._clearMines.bet(userId,msg.betCount,msg.mines,true)){
            const obj = await this._clearMines.autoBetHandler(userId,msg.clicks)
            return { code: Code.OK, data:obj  } ;
        }else{
            return { code: 21, msg: 'Network abnormality, please refresh and try again' }
        }

        
    }

}
