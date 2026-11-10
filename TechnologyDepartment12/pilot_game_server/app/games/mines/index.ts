import { Application, Channel, getLogger } from "pinus";
import { UserService } from "../../services/userService";
import { RecordService } from "../../services/recordService";
import { crop } from "../../util/object";
import { RandomManager, randomNum } from "../../util/random";
import { date2Number, generateUniqueUuid } from "../../util/time";
import controlConfig, { ControlConfig } from "./controlConfig";
import { bet_danQianBao, cancel_danQianBao, getBalanceNew, settle_danQianBao, resolveBetGameCode } from "../../util/HttpsUtil";
import gameConfig, { GameConfig } from "./gameConfig";
import { ControlService } from "../../services/controlService";

const logger = getLogger("mines")

let mines: Mines = null

// 统一创建对象接口
export default function (app: Application) {
    if (mines === null) {
        mines = new Mines(app)
    }
    return mines
}

export class Mines {

    private _userInfos: {
        merchantId: string, userId: number, username: string,
        coin: number, offline: boolean, channelId: number, gameCode: string,
        expand: string, tag: string, walletType: number, firstPlay: boolean, firstWinMax: number
    }[]
    //{username, round_id, betCount, auto, multiple ,payout  ,  betTime,  finishTime  ,beforCoin, CoinTag, betNo_str,betCount_str,win_car_num}
    private _betInfos: {
        userId: number, round_id: number, betCount: number, minesPosArr: number[],
        multiple: number, auto: boolean, cashOut: boolean, gameTag: number,
        betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number,
        currency?: string, minesCount: number, clickArr: number[], payout: number, CoinTag: string,
        downTime: any, gameCode?: string
    }[];                                //手动下注


    private _channel: Channel
    private _observer: Channel
    private _gameConfig: GameConfig
    private _userService: UserService
    private _recordService: RecordService

    /** 随机生成的棋盘 0是钻石，1是地雷 */
    private _MinesMapDatas: { userId: number, map: number[] }[]
    /** 当前游戏中的棋盘 -1未点开，0是钻石，1是地雷 */
    private _MinesNowMapDatas: { userId: number, map: number[] }[]

    private _controlConfig: ControlConfig
    private _setting: { notice: boolean, url: string }
    private _controlService: ControlService;

    constructor(private app: Application) {
        this._userInfos = []
        this._betInfos = []
        this._updating = []
        this._channel = app.channelService.getChannel("game_member_mines", true)
        this._observer = app.channelService.getChannel("observer_member_mines", true)
        this._userService = app.get('userService')
        this._recordService = app.get('recordService')
        this._setting = app.get('setting')
        this._controlService = app.get('controlService')

        this._MinesMapDatas = []
        this._MinesNowMapDatas = []
        this._controlConfig = controlConfig(app)
        this._gameConfig = gameConfig(app)
    }

    public async enter(userId: number, tag: string, channelId: any, gameCode: string): Promise<boolean> {
        const connectors = this.app.getServersByType('mines')
        console.log("     connectors[0].id:", connectors[0].id);
        try {
            const userModal = await this._userService.loadUserInfo(userId, channelId);
            //const walletType = await this._controlService.getWalletType(channelId);

            let coin: number;
            let balanceJson = await getBalanceNew(userModal.username, channelId, this._setting.url, userModal.merchantId, gameCode);
            //let balanceJson = await this._userService.axios_getBalance( userModal.username,channelId)
            if (!balanceJson || balanceJson.code != 0) {
                coin = 0;
            } else {
                coin = parseFloat(balanceJson.data.balance);
            }
            let firstPlay:boolean;
            let firstWinMax: number = 0;
            if( userModal.proportion == 0 && userModal.limit == 0){
                firstPlay = false;
            }else{
                firstWinMax = userModal.proportion / 100 * coin > userModal.limit * 100 ? userModal.limit * 100 : userModal.proportion / 100 * coin;
                firstPlay = !userModal.firstPlay;
            }
            const userInfo = {
                userId: userModal.userId,
                username: userModal.username,
                coin: coin,
                offline: false,
                tag: tag,//
                channelId: channelId,
                gameCode: gameCode,
                expand: userModal.expand,
                walletType: 0,//walletType,
                merchantId: userModal.merchantId,
                firstPlay: firstPlay,
                firstWinMax: firstWinMax
            }
            console.log("userModal",userModal);
            
            let _u = this._userInfos.findIndex(e => e.userId == userInfo.userId)
            if (_u < 0) {
                this._userInfos.push(userInfo);
            } else {
                this._userInfos[_u] = userInfo;
            }
            if (!this._channel.getMember(userInfo.userId.toString())) {
                const connectors = this.app.getServersByType('connector')
                this._channel.add(userInfo.userId.toString(), connectors[0].id);
            }
            this.spliceBetInfoByUserID(userInfo.userId);
            return true
        } catch (error) {
            logger.error('mines enter error:' + error)
            return false
        }
    }

    async getUserBlance(userId: number) {
        let userInfo = this._userInfos.find(e => e.userId === userId);
        let balanceJson = await getBalanceNew(userInfo.username, userInfo.channelId, this._setting.url, userInfo.merchantId, userInfo.gameCode);
        // let balanceJson = JSON.parse(balanceStr);
        let coin: number;
        if (!balanceJson || balanceJson.code != 0) {
            coin = 0;
        } else {
            coin = parseFloat(balanceJson.data.balance);
        }
        userInfo.coin = coin;
        this.sendToUser(userId, "updateCoin", { coin: coin });
    }

    public async getContextMines(userId: number) {
        //如果要保存棋盘 可以在这里做
        //获取用户数据
        const userInfo = this._userInfos.find(e => e.userId === userId)
        // userInfo.coin = await this.getCoin(userInfo.userId)
        return { userInfo: crop(userInfo, 'offline') }
    }

    public canReconnect(userId: number): boolean {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (!userInfo) {
            return false
        }
        return userInfo.offline
    }

    public async reconnect(userId: number, tag: string) {
        const connectors = this.app.getServersByType('connector')
        const userInfo = this._userInfos.find(e => e.userId === userId)
        userInfo.offline = false

        userInfo.tag = tag
        await this.getCoin(userId)
        this._channel.add(userId.toString(), connectors[0].id)
    }


    // 获取注单
    public getBet(userId: number) {
        return this._betInfos.find(e => e.userId === userId)
    }

    // 是否有足够的钱
    public async getCoin(userId: number) {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        // userInfo.coin = await this._userService.axios_getBalance(userInfo.username, userInfo.channelId.toString())
        return userInfo.coin
    }

    // 是否有足够的钱
    public async getCoinLocal(userId: number) {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        return userInfo.coin
    }

    public getUserInfo(userId: number) {
        return this._userInfos.find(e => e.userId === userId)
    }

    public betTimes(userId: number) {
        return this._betInfos.filter(e => e.userId === userId).length
    }

    // 是否有足够的钱
    public async getData(userId: number) {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        const betInfo = this._betInfos.find(e => e.userId === userId)
        return { coin: userInfo.coin, index: betInfo.round_id }
    }

    public async bet(userId: number, betCount: number, mines: number) {
        //随机订单Id
        let index = generateUniqueUuid();//date2Number(new Date()).toString()

        const userInfo = this._userInfos.find(e => e.userId === userId)
        const betGameCode = userInfo.gameCode
        // if (userInfo.walletType == WALLET_TYPE.GONGXIANG) {
        //     let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId.toString(), betCount, index.toString(), this._setting.url);
        //     if (betJson.code != 0) return false
        //     userInfo.coin = betJson.data.balance
        // } else {
        //     userInfo.coin -= betCount;
        // }
        let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId.toString(), betCount, index.toString(), this._setting.url, userInfo.merchantId, betGameCode);
        console.log("扫雷下注,反馈:", betJson);
        if (betJson.code != 0) return false
        userInfo.coin = betJson.data.balance

        this._betInfos.push({
            userId: userId,
            round_id: index,
            betCount: betCount,
            multiple: 1,
            auto: false,
            cashOut: false,
            betTime: new Date(),
            finishTime: new Date(),
            minesCount: mines,
            beforCoin: userInfo.coin,
            afterCoin: 0,
            clickArr: [],
            payout: 0,
            gameTag: 2,
            minesPosArr: [],
            CoinTag: userInfo.tag,
            downTime: 0,
            gameCode: betGameCode
        })
        return true
    }

    public async autoBet(userId: number, amount: number, mines: number, clickArr: number[], count: number) {
        //随机订单Id
        let refId = generateUniqueUuid();//date2Number(new Date()).toString()
        console.log("收到请求:", count);

        const userInfo = this._userInfos.find(e => e.userId === userId)
        const betGameCode = userInfo.gameCode
        // if (userInfo.walletType == WALLET_TYPE.GONGXIANG) {
        //     let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId.toString(), amount, refId, this._setting.url);
        //     if (betJson.code != 0) return false
        //     userInfo.coin = betJson.data.balance
        // } else {
        //     userInfo.coin -= amount;
        // }
        //userInfo.coin -= amount;
        let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId.toString(), amount, refId, this._setting.url, userInfo.merchantId, betGameCode);
        if (betJson.code != 0) return false
        userInfo.coin = betJson.data.balance
        //  console.log("autoBet:", userInfo);

        this._betInfos.push({
            userId: userId,
            round_id: refId,
            betCount: amount,
            multiple: 1,
            auto: true,
            cashOut: false,
            betTime: new Date(),
            finishTime: new Date(),
            minesCount: mines,
            beforCoin: userInfo.coin,
            afterCoin: 0,
            clickArr: clickArr,
            payout: 0,
            gameTag: 2,
            minesPosArr: [],
            CoinTag: userInfo.tag,
            downTime: 0,
            gameCode: betGameCode
        })
        await this.judgmentResult(userId, amount)
        console.log("autoBet处理完毕:", count);
        return true
    }


    // 广播消息
    public async sendToAll(route: string, msg: any) {
        this._observer.apushMessage(route, msg)
        if (route === 'bet') {
            msg.username = msg.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        }
        return this._channel.apushMessage(route, msg)
    }

    private async saveUserCoin(userId: number) {
        const userInfo = this._userInfos.find(e1 => e1.userId === userId)
        this._userService.updateUserCoin(userId, userInfo.coin)
    }

    // 断线
    public async offline(userId: number) {
        const index = this._userInfos.findIndex(e => e.userId === userId)
        if(index < 0)
            return;
        const userInfo = this._userInfos[index];
        this.cashOutMines(userId);//结算
        this.resultToUser(userId)
        console.log("mines用户离线 ---", userId);
        // if (userInfo.walletType == WALLET_TYPE.ZHUAN) {
        //     this.saveUserCoin(userId);
        //     this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }]);
        //     this._userService.notice([{ username: userInfo.username, channelId: userInfo.channelId }]);
        //     this.unlockCoin(userId);
        // }

        this.saveUserCoin(userId);
        this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }]);
        this._userService.notice([{ username: userInfo.username, channelId: userInfo.channelId }]);
        this.unlockCoin(userId);

        //清空用户列表
        this._userInfos.splice(index, 1)
        this._channel.removeMember(userId.toString())

        //清空注单
        let userIndex = this._betInfos.findIndex(e => e.userId === userId);
        while (userIndex >= 0) {
            this._betInfos.splice(userIndex, 1)
            userIndex = this._betInfos.findIndex(e => e.userId === userId);
        }

    }

    private async unlockCoin(userId: number) {
        this._userService.unlockCoin(userId)
    }

    private async judgmentResult(userId: number, amount: number): Promise<number> {
        let betInfo = this._betInfos.find(e => e.userId == userId);
        //  console.log("judgmentResult,betInfo:", betInfo);
        let isWin: boolean;
        let nowMult = this._gameConfig.get_role(betInfo.minesCount, betInfo.clickArr.length);
        let user = this.getUserInfo(userId);
        let con = await this._controlConfig.getControlById(user.channelId);
        //  console.log(nowMult, '------------------------------------->后台设置最大倍率：', con.gamemax)

        const userInfo = this.getUserInfo(userId)
        const maxPayOut = con.gamemax;
        console.log("minese maxPayOut:",maxPayOut);
        
        if(nowMult > maxPayOut){
            return 0;
        }

        let rebate:number = 0;
        if(userInfo.firstPlay){
            const maxMult = Math.floor(userInfo.firstWinMax / amount) + 1;
            let left = 0;
            let right = 0;
            let referNum = 0;
            if (maxMult <= 1) {
                left = 0;
                right = 1;
            } else {
                left = 1;
                right = maxMult;
                if (right - left <= 1) {
                    referNum = 20;
                } else {
                    referNum = 75;
                }
            }
            //输赢概率
            //是否超过最大倍数
            let r = randomNum(0, 100);
            let fwin = r < referNum;
            console.log("minese  新玩家");
            console.log(left + "<      >" + right,"        概率:",referNum);
            rebate = fwin ? -1 : 1;
            betInfo.multiple = fwin ? nowMult : 0;
            console.log("实际倍数:", betInfo.multiple);
        }else{
            rebate = con.rebate;
            const mu = 100 - rebate * 8;
            const gailv = mu / nowMult;
            console.log("clearMines--杀率:",rebate,"    实际胜率:",gailv +"%");
            
            const num = randomNum(1, 1000);
            const isWin = num < gailv * 10 ? true : false;
            betInfo.multiple = isWin ? nowMult : 0;
        }

        return betInfo.multiple;
    }

    /** 位置校验  返回是钻石还是地雷 */
    public async inspectMapPos(pos: number, userId: number): Promise<{ success: boolean, isWin: boolean, length: number }> {
        let betInfo = this._betInfos.find(e => e.userId == userId);
        if (!betInfo) {
            return { success: false, isWin: false, length: 0 }
        }
        if (betInfo.clickArr.indexOf(pos) > -1) {
            return { success: false, isWin: false, length: 0 }
        }

        betInfo.clickArr.push(pos);

        let isWin: boolean = await this.judgmentResult(userId, betInfo.betCount) > 0;
        //如果是地雷  自动结算
        if (!isWin) {
            // betInfo.multiple = 0
            await this.cashOutMines(userId)
           
        }
        if (isWin) {
            //如果钻石被点完了 结算
            //this.cashOutMines(userId)   
        }
        return { success: true, isWin: isWin, length: betInfo.clickArr.length }
    }

    resultToUser(userId: number): { multiple: number, cashOut: number, coin: number, minesPosArr: number[], length: number } {
        let userInfo = this._userInfos.find(e => e.userId == userId)
        let betInfos = this._betInfos.filter(e => e.userId == userId);
        const lastBetInfo = betInfos[betInfos.length - 1];
        let obj = {
            multiple: lastBetInfo.multiple,
            cashOut: lastBetInfo.payout, coin: userInfo.coin, minesPosArr: lastBetInfo.minesPosArr,//是否自动下注
            length: lastBetInfo.clickArr.length
        }
        betInfos.forEach(betInfo => {
            // 保存注单信息
            this.saveUserDataMines(userId, betInfo.round_id);
        })
        return obj
    }

    public async cashOutMines(userId: number) {
        let userInfo = this._userInfos.find(e => e.userId == userId)
        let betInfos = this._betInfos.filter(e => e.userId == userId)
        //   console.log("cashOutMines:", betInfo);

        if (!userInfo) {
            return false
        }
        if (!betInfos) {
            return false
        }


        if (betInfos.length < 1) {
            return false;
        }

        for (let i = 0; i < betInfos.length; i++) {
            const betInfo = betInfos[i];
            if (!betInfo.cashOut) {
                betInfo.finishTime = new Date()
                const reward = betInfo.betCount * betInfo.multiple;
                betInfo.cashOut = true;
                betInfo.payout = reward;
                userInfo.coin += reward;
                betInfo.afterCoin = userInfo.coin;
                settle_danQianBao(userInfo.username, userInfo.channelId, betInfo.round_id.toString(), reward, this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode))
            }
        }


        // if (userInfo.walletType == WALLET_TYPE.GONGXIANG) {
        //     //通知  同步金币
        //     let sellet = await settle_danQianBao(userInfo.username, betInfo.round_id.toString(), userInfo.channelId, reward, this._setting.url)
        //     // let isOk = this._userService.axios_settle(userInfo.username, userInfo.channelId.toString(), reward, betInfo.round_id.toString())

        //     if (!sellet || sellet.code != 0) {
        //         return false
        //     }
        // }

        //通知  同步金币
        //let sellet = await 

        // let isOk = this._userService.axios_settle(userInfo.username, userInfo.channelId.toString(), reward, betInfo.round_id.toString())

        // if (!sellet || sellet.code != 0) {
        //     return false
        // }


        let minesPosArr = [];
        let lastBetInfo = betInfos[betInfos.length - 1];
        //已经结算过了，把棋盘数据发送给用户
        if (lastBetInfo.multiple > 1) {
            minesPosArr = this.pushMines(lastBetInfo, lastBetInfo.minesCount, lastBetInfo.auto);
        }
        else {
            if (lastBetInfo.auto) {
                let ranLei = lastBetInfo.clickArr[randomNum(0, lastBetInfo.clickArr.length - 1)];
                minesPosArr.push(ranLei);
                while (minesPosArr.length < lastBetInfo.minesCount) {
                    let leiR = randomNum(0, 24);
                    while (minesPosArr.indexOf(leiR) > -1) {
                        leiR = randomNum(0, 24)
                    }
                    minesPosArr.push(leiR);
                }
            } else {
                minesPosArr = this.pushMines(lastBetInfo, lastBetInfo.minesCount - 1, lastBetInfo.auto)
                minesPosArr.push(lastBetInfo.clickArr[lastBetInfo.clickArr.length - 1]);
            }
        }

        lastBetInfo.minesPosArr = minesPosArr;
        return true;

    }

    private spliceBetInfoByUserID(userId: number) {
        let uindex = this._betInfos.findIndex(e => e.userId == userId)
        this._betInfos.splice(uindex, 1)
    }

    pushMines(betInfo, length, isAuto): number[] {
        let minesPosArr: number[] = [];
        while (minesPosArr.length < length) {
            let pos = randomNum(0, 24);
            while (betInfo.clickArr.indexOf(pos) > -1 || minesPosArr.indexOf(pos) > -1) {
                pos = randomNum(0, 24)
            }
            minesPosArr.push(pos);
        }
        return minesPosArr
    }

    // 发送数据给玩家
    public async sendToUser(userId: number, route: string, msg: any) {
        const member = this._channel.getMember(userId.toString())
        if (!member) {
            return
        }
        return this.app.channelService.apushMessageByUids(route, msg, [member])
    }

    // 游戏记录入库
    private async saveGameRecord(endType: number, operatorId: number, roundReward: number, roundId: any, result: number, channelID: any, rebate: number = 0) {
        return this._recordService.saveGameRecord(roundReward, roundId, result, endType, operatorId, channelID, rebate)
    }


    private async saveUserDataMines(userId: number, index: number) {
        //修改金额
        const userInfo = this._userInfos.find(e => e.userId === userId)
        try {
            // this._userService.updateUserCoin(userId, userInfo.coin)
            // 用户下注记录入库   游戏记录入库
            let betInfo = this._betInfos.find(e => e.round_id == index);
            if (userInfo.firstPlay) {
                userInfo.firstWinMax -= betInfo.payout - betInfo.betCount;
            }
            if (userInfo.firstWinMax <= 100) {
                userInfo.firstPlay = false;
            }
            console.log("betInfo:",betInfo);
            this._recordService.saveUserData(betInfo, userInfo);
            this.saveGameRecord(0, 0, betInfo.payout, betInfo.round_id, betInfo.multiple, userInfo.channelId);
            //this._recordService.saveBetRecordMines(this._betInfos, this._userInfos, userId, this._MinesMapDatas, this._MinesNowMapDatas)
        } catch (error) {
            logger.error('mines saveBet error:', error)
        } finally {
            let betInfo = this._betInfos.find(e => e.round_id == index);
            let reward = betInfo.betCount * betInfo.multiple;
            //根據輸贏，增減獎池
            this._controlConfig.saveProgress(reward - betInfo.betCount, userInfo.channelId)

            //排查未结算
            if (!betInfo.cashOut) {
                betInfo.finishTime = new Date()
                //const reward = betInfo.betCount * betInfo.multiple;
                betInfo.cashOut = true;
                betInfo.payout = reward;
                userInfo.coin += reward;
                betInfo.afterCoin = userInfo.coin;
                settle_danQianBao(userInfo.username, userInfo.channelId, betInfo.round_id.toString(), reward, this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode))

            }

            //清空注单
            let betInfoIndex = this._betInfos.findIndex(e => e.round_id == index)
            if (betInfoIndex > -1) {
                this._betInfos.splice(betInfoIndex, 1)
            }
            let mapIndex = this._MinesMapDatas.findIndex(e => e.userId == userId)
            if (mapIndex > -1) {
                this._MinesMapDatas.splice(mapIndex, 1)
            }
            let mapNowIndex = this._MinesNowMapDatas.findIndex(e => e.userId == userId)
            if (mapNowIndex > -1) {
                this._MinesNowMapDatas.splice(mapNowIndex, 1)
            }
        }

    }


    // 退出订单
    public async cancel(userId: number) {

        const userInfo = this._userInfos.find(e => e.userId === userId)
        let betInfoIndex = this._betInfos.findIndex(e => e.userId === userId)
        if (betInfoIndex < 0) {
            return { success: false, coin: userInfo.coin }
        }
        const betInfo = this._betInfos[betInfoIndex]

        if (!userInfo) {
            return { success: false, coin: userInfo.coin }
        }

        //通知订单取消
        const betCount = betInfo.betCount
        const cancelJson = await cancel_danQianBao(userInfo.username, userInfo.channelId.toString(), betInfo.round_id.toString(), betCount.toString(), this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode))
        if (!cancelJson || cancelJson.code != 0) {
            //订单取消
            return { success: false, coin: userInfo.coin };
        }
        userInfo.coin += betCount
        this._betInfos.splice(betInfoIndex, 1)

        return { success: true, coin: userInfo.coin }
    }

    public getbetInfo(userId: number) {
        return this._betInfos.find(e => e.userId === userId)
    }
    private _updating: number[];
    public async increaseCoin(userId: number, coin: number): Promise<boolean> {

        if (this._updating.includes(userId)) {
            return false
        }
        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (!userInfo) {
            return false;
        }
        try {
            this._updating.push(userId)
            if (!await this._userService.updateCoin(userId, userInfo.coin, coin)) {
                return false  // 加币失败
            }
        } finally {
            const index = this._updating.indexOf(userId)
            this._updating.splice(index, 1)
        }
        userInfo.coin += coin
        this.sendToUser(userId, 'syncProp_mines', { coin: userInfo.coin })
        return true  // 成功
    }

    public async decreaseCoin(userId: number, coin: number): Promise<boolean> {
        if (this._updating.includes(userId)) {
            return false
        }
        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (coin > userInfo.coin) {
            return false
        }
        try {
            this._updating.push(userId)
            if (!await this._userService.decreaseCoin(userId, userInfo.coin, -coin)) {
                return false
            }
        } finally {
            const index = this._updating.indexOf(userId);
            this._updating.splice(index, 1)
        }
        userInfo.coin -= coin
        if (coin === 0) {
            userInfo.coin = 0
        }
        this.sendToUser(userId, 'syncProp_mines', { coin: userInfo.coin })
        return true
    }


}
