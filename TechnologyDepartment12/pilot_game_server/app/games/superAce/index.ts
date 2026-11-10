import { Application, Channel, getLogger, Logger } from "pinus";
import { UserService } from "../../services/userService";
import { RecordService } from "../../services/recordService";
import { RandomManager, randomNum, weightedRandomSelection } from "../../util/random";
import { date2Number, generateUniqueUuid } from "../../util/time";
import controlConfig, { ControlConfig } from "./controlConfig";
import gameConfig, { GameConfig } from "./gameConfig";
import { bet_danQianBao, getBalanceNew, settle_danQianBao, resolveBetGameCode } from "../../util/HttpsUtil";
import { ControlService } from "../../services/controlService";
import AceInfo from "./AceInfo";

const logger = getLogger("ace")

let _ace: SuperAce = null

// 统一创建对象接口
export default function (app: Application) {
    if (_ace === null) {
        _ace = new SuperAce(app)
    }
    return _ace
}

export class SuperAce {

    private _userInfos: { aceInfo: AceInfo, merchantId: string, walletType: number, userId: number, username: string, coin: number, offline: boolean, channelId: number, gameCode: string, CoinTag: string, gameTag: number }[]
   // private _betInfos: { payout: number, userId: number, round_id: number, betCount: number, multiple: number, auto: boolean, cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number, currency?: string, expand: string }[];                                //手动下注
    private _betInfos: { userId: number, round_id: number, betCount: number, multiple: number, auto: boolean, payout: number, cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number, CoinTag?: string, gameTag: number, gameCode?: string}[];                              //手动下注


    private _channel: Channel
    private _observer: Channel
    private _userService: UserService
    private _recordService: RecordService
    private _controlService: ControlService;

    private _controlConfig: ControlConfig
    private _gameConfig: GameConfig
    private _setting: { notice: boolean, url: string }
    private _app;
    constructor(private app: Application) {
        this._app = app;
        this._userInfos = []
        this._betInfos = []

        this._channel = app.channelService.getChannel("game_member_ace", true)
        this._observer = app.channelService.getChannel("observer_member_ace", true)
        this._userService = app.get('userService')
        this._recordService = app.get('recordService')
        this._setting = app.get('setting')
        this._controlService = app.get('controlService')

        this._controlConfig = controlConfig(app)
        this._gameConfig = gameConfig(app)
    }

    public async enter(userId: number, tag: string, channelId: any, gameCode: string): Promise<boolean> {
        const connectors = this.app.getServersByType('connector')
        try {
            const userModal = await this._userService.loadUserInfo(userId,channelId)

            // let walletType = await this._controlService.getWalletType(channelId);
            // console.log("----Ace用户登录:", userModal, "     walletType:", walletType);

            let coin: number;
            // // if (walletType == WALLET_TYPE.ZHUAN) {
            // //     coin = await this._userService.getUserCoinById(userId);
            // // } else {
            // //     let balanceJson = await getBalanceNew(userModal.username, channelId, this._setting.url);
            // //     // let balanceJson = JSON.parse(balanceStr);

            // //     if (!balanceJson || balanceJson.code != 0) {
            // //         coin = 0;
            // //     } else {
            // //         coin = parseFloat(balanceJson.data.balance);
            // //     }
            // // }
            let balanceJson = await getBalanceNew(userModal.username, channelId, this._setting.url, userModal.merchantId, gameCode);
            //let balanceJson = JSON.parse(balanceStr);

            if (!balanceJson || balanceJson.code != 0) {
                coin = 0;
            } else {
                coin = parseFloat(balanceJson.data.balance);
            }

            const userInfo = {
                userId: userModal.userId,
                username: userModal.username,
                coin: coin,
                offline: false,
                CoinTag: tag,
                gameTag: this._gameConfig.gameTag,
                channelId: channelId,
                gameCode: gameCode,
                expand: userModal.expand,
                walletType: 2,
                merchantId: userModal.merchantId,
                aceInfo: null
            }

            const userIndex = this._userInfos.findIndex(e => e.userId == userInfo.userId)
            if (userIndex < 0) {
                this._userInfos.push(userInfo);
            } else {
                this._userInfos[userIndex] = userInfo;
            }
    
            if (!this._channel.getMember(userInfo.userId.toString())) {
                const connectors = this.app.getServersByType('connector')
                this._channel.add(userInfo.userId.toString(), connectors[0].id);
            }
            return true
        } catch (error) {
            logger.error('Ace enter error:' + error)
            return false
        }
    }


    run() {
        console.log("------ACE启动------");
    }

    public async getContextAce(userId: number) {
        //获取用户数据
        const userInfo = this._userInfos.find(e => e.userId === userId)
        // userInfo.coin = await this.getCoin(userInfo.userId)
        return { userInfo: userInfo }
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

        userInfo.CoinTag = tag
        await this.getCoin(userId)
        this._channel.add(userId.toString(), connectors[0].id)
    }


    // 获取注单
    public getBet(userId: number) {
        return this._betInfos.find(e => e.userId === userId)
    }

    public getUserInfo(userId: number) {
        return this._userInfos.find(e => e.userId === userId)
    }

    // 查询金币  需要调用接口
    public async getCoin(userId: number) {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        let balanceJson = await getBalanceNew(userInfo.username, userInfo.channelId, this._setting.url, userInfo.merchantId, userInfo.gameCode);
        return balanceJson.data.coin
    }
    // 查询金币  内存中
    public async getCoinLocal(userId: number) {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        return await userInfo.coin
    }

    public async bet(userId: number, msg: { betCount: number, tag: string, auto: boolean }):
        Promise<{
            code: number,
            coin: number
        }> {
        console.log("***********************ACE开始下注**************************");
        let betTime = new Date()
        const userInfo = this._userInfos.find(e => e.userId === userId)
        const betGameCode = userInfo.gameCode
        let beforCoin = userInfo.coin;
        //随机订单Id
        let index = generateUniqueUuid() + randomNum(0,8);//date2Number(new Date()).toString() + userInfo.userId;

        // if (userInfo.walletType == WALLET_TYPE.GONGXIANG) {
        //     let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId, betCount, index, this._setting.url)
        //     if (betJson.code != 0 || !betJson) return { code: 1, data: null }
        //     userInfo.coin = betJson.data.balance
        // } else {
        //     userInfo.coin -= betCount;
        // }
        const betJson = await bet_danQianBao(userInfo.username, userInfo.channelId, msg.betCount, index, this._setting.url,userInfo.merchantId, betGameCode)
        if (betJson.code != 0 || !betJson) return { code: 1,coin: userInfo.coin}
        // userInfo.coin = betJson.data.balance
        /* 但钱包下注 */
        userInfo.coin -= msg.betCount;
        console.log("***********************ACE下注成功**************************")
        const betInfo = {
            userId: userId,
            username: userInfo.username,
            round_id: index,//这特么是订单编号，他命名index
            betCount: msg.betCount,
            auto: false,
            cashOut: false,
            multiple: 0,
            payout: 0,
            betTime: betTime,
            finishTime: new Date(),
            beforCoin: beforCoin,
            afterCoin: userInfo.coin,
            expand: "1",
            CoinTag: userInfo.CoinTag,
            gameTag: 8,
            betNo_str: null,     //'betNo_str,'  赛车相关
            betCount_str: null,   //' betCount_str,' 赛车相关
            win_car_num: null,      //'win_car_num,' 赛车相关
            gameCode: betGameCode
        }
        this._betInfos.push(betInfo);
        //获取结果  1.小熊掌  2.奶咯  3.蛋糕
        this.createGame(userId, msg.auto);
        return { code: 0, coin: userInfo.coin }
        // if (isOk) {

        //     console.log("***********************糖果结算成功**************************");
        //     userInfo.coin += rewardAmount;
        //     let data = {
        //         coin: userInfo.coin,
        //         multIndex: 0,
        //         multiple: 0,
        //         cashOut: rewardAmount
        //     }

        //     //记录入库
        //     this._recordService.saveUserData(betInfo, userInfo);
        //     //this.saveUserData(betInfo, userInfo)
        //     this._controlConfig.saveProgress(rewardAmount == 0 ? betCount : -betCount * 1 * mult, userInfo.channelId);
        //     //广播下注信息
        //     this.sendToAll("TripleBet", {
        //         username: userInfo.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"),
        //         betCount: betCount,
        //         cashOut: rewardAmount,
        //         multiple: mult
        //     })
        //     return { code: 0, data: data }
        // } else {
        //     console.log("***********************糖果结算失败**************************");
        //     return { code: 1, data: null }
        // }
    }

    // 游戏记录入库
    private async saveGameRecord(endType: number, operatorId: number, roundReward: number, roundId: any, result: number, channelID: any) {
        return this._recordService.saveGameRecord(roundReward, roundId, result, endType, operatorId, channelID)
    }

    private async saveUserData(betInfo: any, userInfo: any) {
        // 用户下注记录入库   游戏记录入库
        this._recordService.saveUserData(betInfo, userInfo)
    }

    end_userGame(userId: number, mult: number, payOut: any) {
        const userInfo = this._userInfos.find(e => e.userId == userId);
        if (!userInfo) { return }
        let betInfo = this._betInfos.find(b => b.userId == userId);
        if (!betInfo) { return }

        settle_danQianBao(userInfo.username, userInfo.channelId.toString(), betInfo.round_id, payOut, this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode));

        betInfo.multiple = mult;
        betInfo.payout = payOut;
        try {
            //入库
            this.saveGameRecord(0, 0, betInfo.payout, betInfo.round_id,  betInfo.multiple, userInfo.channelId);
            this.saveUserData(betInfo, userInfo);
        } catch (error) {
            logger.error('save user data error:', error)
            return { success: false, multiple: 0, cashOut: 0 }
        } finally {
            //根據輸贏，增減獎池
            this._controlConfig.saveProgress(betInfo.payout - betInfo.betCount, userInfo.channelId)
            this.clearBetInfo(userId)
        }

        const delindex = this._betInfos.findIndex(e => e.userId == userInfo.userId)
        this._betInfos.splice(delindex, 1);
        userInfo.aceInfo = null;
    }

    private async createGame(userId: number, auto: boolean) {
        let userInfo = this._userInfos.find(u => u.userId == userId);
        if (!userInfo) {
            return false;
        }
        let betInfo = this._betInfos.find(u => u.userId == userId);
        if (!betInfo) {
            return false;
        }
        userInfo.aceInfo = new AceInfo(this._app, userId, auto, betInfo.betCount);
        userInfo.aceInfo.run();
    }

    getMult(num: number, length: number, round: number): number {
        return this._gameConfig.getMultByNumAndLength(num, length, round);
    }
    getNum(shuIndex: number): { num: number, isGold: boolean } {
        // shuIndex == 0 ? randomRangeInt(3, 9) : randomRangeInt(3, 11);
        let num: number;
        if (shuIndex == 0) {
            let nums = [3, 4, 5, 6, 7, 8, 9, 10];
            let weights = [20, 20, 30, 30, 15, 15, 10, 7];
            num = weightedRandomSelection(nums, weights);
        } else {
            num = randomNum(3, 10);
        }

        let obj = {
            num: num,
            isGold: false
        }
        if (shuIndex != 0 && shuIndex != 4) {
            let ran = randomNum(1, 100);
            if (ran < 12)
                obj.isGold = true;
        }
        return obj
    }

    // 广播消息
    public async sendToAll(route: string, msg: any) {
        this._observer.apushMessage(route, msg)
        if (route === 'bet') {
            msg.username = msg.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        }
        return this._channel.apushMessage(route, msg)
    }

    saveUserCoin(userId: number, coin: number): number {
        const userInfo = this._userInfos.find(e1 => e1.userId === userId);
        userInfo.coin += coin;
        return userInfo.coin;
        //this._userService.updateUserCoin(userId, userInfo.coin)
    }

    private async unlockCoin(userId: number) {
        this._userService.unlockCoin(userId)
    }

    // 断线
    public async offline(userId: number) {

        const index = this._userInfos.findIndex(e => e.userId === userId)
        const userInfo = this._userInfos[index];
        console.log("ace用户离线 ---", userId, "   钱包类型:", userInfo.walletType);
        // if (userInfo.walletType == WALLET_TYPE.ZHUAN) {
        //     this.saveUserCoin(userId);
        //     this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }]);
        //     this._userService.notice([{ username: userInfo.username, channelId: userInfo.channelId }]);
        //     this.unlockCoin(userId);
        // }
        //this.saveUserCoin(userId);
        this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }]);
        this._userService.notice([{ username: userInfo.username, channelId: userInfo.channelId }]);
        this.unlockCoin(userId);
        await this.end_userGame(userId, 0, 0);
        //清空用户列表
        this._userInfos.splice(index, 1)
        this._channel.removeMember(userId.toString())
        //清空注单
     
    }

    // 发送数据给玩家
    public async sendToUser(userId: number, route: string, msg: any) {
        const member = this._channel.getMember(userId.toString())
        if (!member) {
            return
        }
        return this.app.channelService.apushMessageByUids(route, msg, [member])
    }

    public getbetInfo(userId: number) {
        return this._betInfos.find(e => e.userId === userId)
    }

    /** 清空注单 */
    public clearBetInfo(userId) {
        //清空注单
        let betInfoIndex = this._betInfos.findIndex(e => e.userId === userId)
        this._betInfos.splice(betInfoIndex, 1)
    }

    getSeting(): { notice: boolean, url: string } {
        return this._setting;
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
        this.sendToUser(userId, 'syncProp_ace', { coin: userInfo.coin })
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
        this.sendToUser(userId, 'syncProp_ace', { coin: userInfo.coin })
        return true
    }
}
