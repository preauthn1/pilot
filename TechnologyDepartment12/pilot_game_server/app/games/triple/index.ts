import { Application, Channel, getLogger, Logger } from "pinus";
import { UserService } from "../../services/userService";
import { RecordService } from "../../services/recordService";
import { crop } from "../../util/object";
import { RandomManager, randomNum } from "../../util/random";
import { date2Number, generateUniqueUuid } from "../../util/time";
import controlConfig, { ControlConfig } from "./controlConfig";
import gameConfig, { GameConfig } from "./gameConfig";
import { bet_danQianBao, getBalanceNew, settle_danQianBao, resolveBetGameCode } from "../../util/HttpsUtil";
import { ControlService } from "../../services/controlService";
import { WALLET_TYPE } from "../../consts/code";

const logger = getLogger("triple")

let triple: Triple = null

// 统一创建对象接口
export default function (app: Application) {
    if (triple === null) {
        triple = new Triple(app)
    }
    return triple
}

export class Triple {

    private _userInfos: {
        merchantId: string, userId: number, username: string, coin: number,
        offline: boolean, channelId: number, gameCode: string, CoinTag: string, gameTag: number,
        walletType: number, firstPlay: boolean, firstWinMax: number
    }[]
    private _betInfos: { userId: number, index: string, betCount: number, multiple: number, auto: boolean, cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number, currency?: string, mapPos: number[], expand: string, clickMapPos: number[] }[];                                //手动下注


    private _channel: Channel
    private _observer: Channel
    private _userService: UserService
    private _recordService: RecordService
    private _controlService: ControlService;
    private _controlConfig: ControlConfig
    private _gameConfig: GameConfig
    private _setting: { notice: boolean, url: string }

    constructor(private app: Application) {
        this._userInfos = []
        this._betInfos = []
        this._updating = [];
        this._channel = app.channelService.getChannel("game_member_triple", true)
        this._observer = app.channelService.getChannel("observer_member_triple", true)
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
            const userModal = await this._userService.loadUserInfo(userId, channelId);

            let walletType = 0;// await this._controlService.getWalletType(channelId);
            let coin: number;
            let balanceJson = await getBalanceNew(userModal.username, channelId, this._setting.url, userModal.merchantId, gameCode);
            // let balanceJson = JSON.parse(balanceStr);

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
                CoinTag: tag,
                gameTag: this._gameConfig.gameTag,
                channelId: channelId,
                gameCode: gameCode,
                expand: userModal.expand,
                walletType: walletType,
                merchantId: userModal.merchantId,
                firstWinMax: firstWinMax,
                firstPlay: firstPlay,
            }
            let i = this._userInfos.findIndex(u => u.userId == userId);
            if (i >= 0) {
                this._userInfos.splice(i, 1);
            }
            this._userInfos.push(userInfo);
            if (!this._channel.getMember(userInfo.userId.toString())) {
                const connectors = this.app.getServersByType('connector')
                this._channel.add(userInfo.userId.toString(), connectors[0].id);
            }
            console.log("triple玩家登录:", userInfo);

            return true
        } catch (error) {
            logger.error('Triple enter error:' + error)
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

    public async getContextDice(userId: number) {
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
        userInfo.coin = await this._userService.axios_getBalance(userInfo.username, userInfo.channelId.toString())
        return userInfo.coin
    }
    // 查询金币  内存中
    public async getCoinLocal(userId: number) {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        return await userInfo.coin
    }

    public async bet(userId: number, betCount: number, diff: number, poss: number[], coinTag: string):
        Promise<{
            code: number,
            data: {
                coin: number,
                mapPos: number[],
                multiple: number,
                multIndex: number,
                cashOut: number;
            }
        }> {
        console.log("***********************糖果开始下注**************************");
        let betTime = new Date()
        const userInfo = this._userInfos.find(e => e.userId === userId)
        let beforCoin = userInfo.coin;
        //随机订单Id
        let index = generateUniqueUuid();//date2Number(new Date()).toString() + userInfo.userId;

        // if (userInfo.walletType == WALLET_TYPE.GONGXIANG) {
        //     /* 单钱包下注 */
        //     let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId, betCount, index, this._setting.url)
        //     if (!betJson || betJson.code != 0) return { code: 1, data: null }
        //     userInfo.coin = betJson.data.balance
        // } else {
        //     userInfo.coin -= betCount;
        // }
        /* 单钱包下注 */
        const betGameCode = userInfo.gameCode
        let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId, betCount, index, this._setting.url, userInfo.merchantId, betGameCode)
        if (!betJson || betJson.code != 0) return { code: 1, data: null }
        userInfo.coin = betJson.data.balance
        //   console.log("***********************糖果下注成功*************************");

        //获取结果  1.小熊掌  2.奶咯  3.蛋糕
        // let multData: { mult: number, piece: number[], index: number } = await this._controlConfig.getMultArrByDifficulty(diff, userInfo.channelId);
        let multData: { mult: number, piece: number[], tag: number } = await this._controlConfig.getMultArrByDifficulty(diff, userInfo.channelId);
        if (userInfo.firstPlay) {

            const maxMult = Math.floor(userInfo.firstWinMax / betCount) + 1;
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
            console.log("triple  新玩家");
            console.log(left + "<      >" + right,"        概率:",referNum);
            while ((fwin && multData.mult <= 1) || (!fwin && multData.mult > 1) || multData.mult > maxMult) {
                multData = await this._controlConfig.getMultArrByDifficulty(diff, userInfo.channelId);
              
                r = randomNum(0, 100);
                fwin = r < referNum;
            }
           
            console.log("实际倍数:", multData.mult);
        }

        let rewardAmount = betCount * multData.mult;

        settle_danQianBao(userInfo.username, userInfo.channelId, index, rewardAmount, this._setting.url, userInfo.merchantId, resolveBetGameCode(betGameCode, userInfo.gameCode));

        //    console.log("***********************糖果结算成功**************************");
        let arr: number[] = this.getUserArr(poss, multData.piece)
        userInfo.coin += rewardAmount;
        let data = {
            coin: userInfo.coin,
            mapPos: arr,
            multIndex: multData.tag - 1,
            multiple: multData.mult,
            cashOut: rewardAmount
        }
        const betInfo = {
            userId: userId,
            username: userInfo.username,
            round_id: index,//这特么是订单编号，他命名index
            betCount: betCount,
            auto: false,
            multiple: multData.mult,
            payout: rewardAmount,
            betTime: betTime,
            finishTime: new Date(),
            beforCoin: beforCoin,
            afterCoin: userInfo.coin,
            expand: 1,
            CoinTag: coinTag,
            gameTag: 6,
            betNo_str: null,     //'betNo_str,'  赛车相关
            betCount_str: null,   //' betCount_str,' 赛车相关
            win_car_num: null       //'win_car_num,' 赛车相关
        }
        //记录入库
        // this._recordService.saveUserData(betInfo, userInfo);
        userInfo.firstWinMax -= rewardAmount - betCount;
        this.saveGameRecord(0, 0, rewardAmount, betInfo.round_id, betInfo.multiple, userInfo.channelId);
        this.saveUserData(betInfo, userInfo);
        // rewardAmount - betCount;
        this._controlConfig.saveProgress(rewardAmount - betCount, userInfo.channelId);
        //广播下注信息
        this.sendToAll("TripleBet", {
            username: userInfo.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"),
            betCount: betCount,
            cashOut: rewardAmount,
            multiple: multData.mult
        })
        return { code: 0, data: data }
    }

    private getUserArr(poss, piece) {
        let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
            21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]
        let endArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        //未选中区域
        let temp = []
        //选中区域
        let temp1 = []
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == poss[0] || arr[i] == poss[1] || arr[i] == poss[2]) {
                temp1.push(arr[i])
            } else {
                temp.push(arr[i])
            }
        }
        // console.log('---------------------------------------->未选中区域:', temp)
        // console.log('---------------------------------------->选中区域:', temp1)

        let a = piece[0]
        let b = piece[1]
        let c = piece[2]

        endArr[temp1[0]] = a
        endArr[temp1[1]] = b
        endArr[temp1[2]] = c

        // console.log('---------------------------------------->最终生成的数组----1:', endArr)

        a = 27 - endArr.filter(e => e == 1).length
        b = 6 - endArr.filter(e => e == 2).length
        c = 3 - endArr.filter(e => e == 3).length

        let abc = a + b + c
        // console.log('---------------------------------------->a:', a)
        // console.log('---------------------------------------->b:', b)
        // console.log('---------------------------------------->b:', c)
        // console.log('---------------------------------------->未选中区域总数:', abc)//33


        var temp2 = temp;//在未选中区域 随机
        var result = [];
        for (let i = 0; i < c; i++) {
            let index = RandomManager.instance.getRandomInt(0, temp2.length - 1, 2)
            let value = temp2.splice(index, 1)[0]
            result.push(value)
            endArr[value] = 3
        }
        // console.log('---------------------------------------->c的位置:', result)

        result = [];
        for (let i = 0; i < b; i++) {
            let index = RandomManager.instance.getRandomInt(0, temp2.length - 1, 2)
            let value = temp2.splice(index, 1)[0]
            result.push(value)
            endArr[value] = 2
        }
        // console.log('---------------------------------------->b的位置:', result)

        result = [];
        for (let i = 0; i < a; i++) {
            let index = RandomManager.instance.getRandomInt(0, temp2.length - 1, 2)
            let value = temp2.splice(index, 1)[0]
            result.push(value)
            endArr[value] = 1
        }
        // console.log('---------------------------------------->a的位置:', result)
        // console.log('---------------------------------------->最终生成的数组:', endArr)

        return endArr
    }

    // 游戏记录入库
    private async saveGameRecord(endType: number, operatorId: number, roundReward: number, roundId: any, result: number, channelID: any) {
        return this._recordService.saveGameRecord(roundReward, roundId, result, endType, operatorId, channelID)
    }


    private async saveUserData(betInfo: any, userInfo: any) {
        // 用户下注记录入库   游戏记录入库
        let sqlParamArr = [];
        let sqlParam = [];

        sqlParam.push(userInfo.userId);     //'user_id,'
        sqlParam.push(betInfo.username);   //' user_name,' 
        sqlParam.push(betInfo.round_id);       //'round_id,' 

        sqlParam.push(betInfo.betCount);     // ' bet,' +
        sqlParam.push(betInfo.auto);   // 'bet_type,'
        sqlParam.push(betInfo.multiple);       //'settlement_multiple,' 

        sqlParam.push(parseInt(betInfo.payout.toFixed(0)));     //'pay_out,'
        sqlParam.push(betInfo.betTime);   //' bet_time,' +
        sqlParam.push(betInfo.finishTime);       //'finish_time,' +
        sqlParam.push(betInfo.beforCoin);     //'before_coin,'
        sqlParam.push(userInfo.coin);   //' after_coin,' +
        sqlParam.push(userInfo.expand);       //'expand,' +

        sqlParam.push(betInfo.CoinTag);     //'tag,'   币种
        sqlParam.push(6);   //' game_tag,' 游戏类型
        sqlParam.push(userInfo.channelId);       //'channel_id,'  渠道ID

        sqlParam.push(null);     //'betNo_str,'  赛车相关
        sqlParam.push(null);   //' betCount_str,' 赛车相关
        sqlParam.push(null);       //'win_car_num,' 赛车相关
        sqlParam.push(Math.floor(betInfo.betTime.getTime() / 1000));       //时间戳
        sqlParam.push(new Date());                                        //created_at
        sqlParam.push(new Date());                                        //update_at

        sqlParamArr.push(sqlParam)
        this._recordService.saveBetRecordNew(sqlParamArr)
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
        const userInfo = this._userInfos[index];
        console.log("triple用户离线 ---", userId);
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
        let userIndex = this._betInfos.findIndex(e => e.userId === userId)
        this._betInfos.splice(userIndex, 1)
    }

    private async unlockCoin(userId: number) {
        this._userService.unlockCoin(userId)
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
                console.log("triple 加币失败加币失败:", userId);

                return false  // 加币失败
            }
        } finally {
            const index = this._updating.indexOf(userId)
            this._updating.splice(index, 1)
        }
        userInfo.coin += coin
        this.sendToUser(userId, 'syncProp_triple', { coin: userInfo.coin })
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
        this.sendToUser(userId, 'syncProp_triple', { coin: userInfo.coin })
        return true
    }
}
