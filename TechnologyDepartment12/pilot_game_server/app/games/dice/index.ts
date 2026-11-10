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

const logger = getLogger("dice")

let dice: Dice = null

// 统一创建对象接口
export default function (app: Application) {
    if (dice === null) {
        dice = new Dice(app)
    }
    return dice
}

export class Dice {

    private _userInfos: {
        merchantId: string, userId: number, username: string,
        coin: number, offline: boolean, channelId: number, gameCode: string, expand: string,
        CoinTag: string, gameTag: number, walletType: number, firstPlay: boolean, firstWinMax: number
    }[]
    private _betInfos: { userId: number, round_id: number, betCount: number, multiple: number, auto: boolean, payout: number, cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number, CoinTag?: string, gameTag: number, rollUnder: number, gameCode?: string }[];                                //手动下注


    private _channel: Channel
    private _observer: Channel
    private _userService: UserService
    private _recordService: RecordService

    private _controlConfig: ControlConfig
    private _gameConfig: GameConfig
    private _setting: { notice: boolean, url: string }
    private _controlService: ControlService;

    constructor(private app: Application) {
        this._userInfos = [];
        this._betInfos = [];
        this._updating = [];

        this._channel = app.channelService.getChannel("game_member_dice", true)
        this._observer = app.channelService.getChannel("observer_member_dice", true)
        this._userService = app.get('userService')
        this._recordService = app.get('recordService')
        this._setting = app.get('setting')
        this._controlService = app.get('controlService')

        this._controlConfig = controlConfig(app)
        this._gameConfig = gameConfig(app)
    }

    public async enter(userId: number, tag: string, channelId: any, gameCode: string): Promise<boolean> {

        try {
            const userModal = await this._userService.loadUserInfo(userId,channelId)
            console.log("         dice用户登录:", userModal, "   channelId:", channelId);

            let walletType = await this._controlService.getWalletType(channelId);
            

            let coin: number;
            let balanceJson = await getBalanceNew(userModal.username, channelId, this._setting.url, userModal.merchantId, gameCode);
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
                channelId: channelId,//10026
                gameCode: gameCode,
                expand: userModal.expand,
                walletType: walletType,
                merchantId: userModal.merchantId,
                firstWinMax: firstWinMax,
                firstPlay: firstPlay,
            }
            //
            let i = this._userInfos.findIndex(u => u.userId == userId);
            if (i >= 0) {
                this._userInfos.splice(i, 1);
            }
            this._userInfos.push(userInfo);

            if (!this._channel.getMember(userInfo.userId.toString())) {
                const connectors = this.app.getServersByType('connector')
                this._channel.add(userInfo.userId.toString(), connectors[0].id);
            }
            console.log("----dice用户登录:", userInfo);
            return true
        } catch (error) {
            logger.error('dice enter error:' + error)
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


    public getUserInfo(userId: number) {
        return this._userInfos.find(e => e.userId === userId)
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

    public async bet(userId: number, betCount: number) {
        //随机订单Id
        let index = generateUniqueUuid();//date2Number(new Date()).toString()

        const userInfo = this._userInfos.find(e => e.userId === userId)
        const betGameCode = userInfo.gameCode

        // if(userInfo.walletType == WALLET_TYPE.GONGXIANG){
        //     let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId, betCount, index, this._setting.url)
        //     if (betJson.code != 0) return false
        //     userInfo.coin = betJson.data.balance
        // }else{
        //     userInfo.coin -= betCount;
        // }
        console.log("DICE CHANNLEID:", userInfo.channelId);

        let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId, betCount, index, this._setting.url, userInfo.merchantId, betGameCode)
        if (betJson.code != 0) return false
        userInfo.coin = betJson.data.balance

        this._betInfos.push({
            userId: userId,
            round_id: index,
            betCount: betCount,
            multiple: -1,
            auto: false,
            cashOut: false,
            betTime: new Date(),
            finishTime: new Date(),
            beforCoin: userInfo.coin,//下注后余额
            afterCoin: 0,//派彩后余额
            rollUnder: -1,
            CoinTag: userInfo.CoinTag,
            gameTag: userInfo.gameTag,
            payout: 0,
            gameCode: betGameCode
        })
        //通知客户端更新金币
        this.sendToUser(userId, 'updateCoin', { coin: userInfo.coin })
        return true
    }

    //获取骰子结果   rollUnder//1-100所在位置，用户选择的倍率    firstPlayMaxWin//新玩家最大能赢的数额
    public async getValue(rollUnder, isZF, channelId, betCount: number, firstPlayMaxWin: number) {

        let currTime = new Date().getTime()
        //第一次启动需要赋值
        if (this.yltime == 0) { this.yltime = currTime }
        //如果大于24小时
        if (currTime - this.yltime > 24 * 60 * 1000) {
            //重置时间
            this.yltime = new Date().getTime()
            //重置当前盈利数
        }

        //采用bcgame上面公式：((50/rollUnder)*1.98) =1.98
        let isWin = false  //控制输赢

        //倍率增加 难度增加  待删
        // let sl = 0
        // let bl = 0
        // if (isZF) {
        //     bl = 100 - (rollUnder * 1)
        //     sl = ((50 / bl) * 1.98)
        // } else {
        //     bl = rollUnder * 1
        //     sl = ((50 / bl) * 1.98)
        // }

        let userMult = 0;
        if (isZF) {
            userMult = (50 / (100 - rollUnder)) * 1.98;
        } else {
            //默认
            userMult = (50 / rollUnder) * 1.98;
        }

        let con = await this._controlConfig.getControlById(channelId)
        if (con) {
            let rebate = con.rebate;
            if (con.gamemax / 100 <= userMult) {
                //console.log("超过最大结算倍数");
                isWin = false;
            } else {
                if (!isNaN(firstPlayMaxWin)) {

                    const maxMult = Math.floor(firstPlayMaxWin / betCount) + 1;
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
                            referNum = 80;
                        }
                    }
                    //输赢概率
                    //是否超过最大倍数
                    let r = randomNum(0, 100);
                   // let fwin = r < referNum;
                    console.log("dice  新玩家     referNum:",referNum);
                    isWin = r < referNum;
           
                    console.log(left + "<      >" + right, "        实际胜负:", isWin);

                } else {
                    if (con.rebate < 0 || con.rebate > 9) {
                        rebate = 9;
                    }
                    let m = 100 - (rebate) * 2;   // 1    100 - 8 = 92   92%      //100
                    let gailv_shalv = m / (userMult == 1.98 ? 2 : userMult);
                    let num = randomNum(1, 1000);
                    isWin = num < gailv_shalv * 10
                    // console.log(' ---------------------------------->实时杀率(0~9):', rebate);
                    // console.log(' ---------------------------------->实际赢面:', gailv_shalv);
                    // console.log(' ---------------------------------->最终结果:', isWin);
                }
                //console.log(' ---------------------------------->水池是否已满', await this._controlConfig.finished(channelId))
                // if (await this._controlConfig.finished(channelId)) {
                //     //后台控制杀率
                //     //0-9之间  包含0和9
                //     if (con.rebate < 0 || con.rebate > 9) {
                //         rebate = 9;
                //     }
                // } else {
                //     rebate = -1.5;
                // }

       

            }

            //组装用户假数据
            if (isWin) {
                //反向
                if (isZF) {
                    return { rollUnder: RandomManager.instance.getRandomInt(rollUnder, 99), payout: parseFloat(((50 / (100 - rollUnder)) * 1.98).toFixed(2)) }
                } else {
                    //默认
                    return { rollUnder: RandomManager.instance.getRandomInt(1, rollUnder), payout: parseFloat(((50 / rollUnder) * 1.98).toFixed(2)) }
                }
            } else {
                if (isZF) {
                    return { rollUnder: RandomManager.instance.getRandomInt(1, rollUnder), payout: 0 }
                } else {
                    //默认
                    return { rollUnder: RandomManager.instance.getRandomInt(rollUnder, 99), payout: 0 }
                }
            }
        } else {
            if (isZF) {
                return { rollUnder: RandomManager.instance.getRandomInt(1, rollUnder), payout: 0 }
            } else {
                //默认
                return { rollUnder: RandomManager.instance.getRandomInt(rollUnder, 99), payout: 0 }
            }
        }

    }

    private yltime: number = 0//盈利结束时间


    // value 赔率    payout 1-100所在的区间
    public async cashOut(userId, rollUnder, payout, isZF) {

        const betInfo = this._betInfos.find(e => e.userId == userId)
        const userInfo = this._userInfos.find(e => e.userId == userId)
        if (!betInfo) {
            return { success: false, multiple: 0, cashOut: 0 }
        }
        if (betInfo.cashOut) {
            return { success: false, multiple: 0, cashOut: 0 }
        }
        if (!userInfo) {
            return { success: false, multiple: 0, cashOut: 0 }
        }

        console.log("-------diceCahOut----------", (50 / rollUnder) * 1.98);
        const firstWinMax: number = userInfo.firstPlay ? userInfo.firstWinMax : NaN;
        let result = await this.getValue(rollUnder, isZF, userInfo.channelId, betInfo.betCount, firstWinMax);
        betInfo.cashOut = true
        betInfo.multiple = result.payout
        betInfo.rollUnder = result.rollUnder
        betInfo.finishTime = new Date()
        const reward = betInfo.betCount * betInfo.multiple
        let betC = betInfo.betCount

        settle_danQianBao(userInfo.username, userInfo.channelId, betInfo.round_id, reward, this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode));

        userInfo.coin += reward
        betInfo.afterCoin = userInfo.coin
        betInfo.payout = reward;
        if (userInfo.firstPlay) {
            userInfo.firstWinMax -= reward - betInfo.betCount;
        }
        if (userInfo.firstWinMax <= 100) {
            userInfo.firstPlay = false;
        }
        try {
            //入库
            this.saveGameRecord(0, 0, reward, betInfo.round_id, betInfo.multiple, userInfo.channelId);
            this.saveUserData(betInfo, userInfo);
        } catch (error) {
            logger.error('save user data error:', error)
            return { success: false, multiple: 0, cashOut: 0 }
        } finally {
            //根據輸贏，增減獎池
            this._controlConfig.saveProgress(reward - betC, userInfo.channelId)
            this.clearBetInfo(userId)

        }

        // 结算返回
        return {
            success: true, index: betInfo.round_id!, multiple: betInfo.multiple,
            cashOut: reward, coin: userInfo.coin, rollUnderValue: result.rollUnder, tag: userInfo.CoinTag, betCount: betInfo.betCount
        }
    }

    // 游戏记录入库
    private async saveGameRecord(endType: number, operatorId: number, roundReward: number, roundId: any, result: number, channelID: any, rebate: number = 0) {
        return this._recordService.saveGameRecord(roundReward, roundId, result, endType, operatorId, channelID, rebate)
    }

    private async saveUserData(betInfo: any, userInfo: any) {
        // 用户下注记录入库   游戏记录入库
        this._recordService.saveUserData(betInfo, userInfo)
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
        console.log("dice用户离线 ---", userId);
        // if (userInfo.walletType == WALLET_TYPE.ZHUAN) {
        //     this.saveUserCoin(userId);
        //     this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }]);
        //     this._userService.notice([{ username: userInfo.username, channelId: userInfo.channelId }]);
        //     this.unlockCoin(userId);
        // }

        const userBets = this._betInfos.filter(b => b.userId == userId);
        userBets.forEach(betInfo => {
            //结算
            if (!betInfo.cashOut) {
                settle_danQianBao(userInfo.username, userInfo.channelId, betInfo.round_id, 0, this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode));
                betInfo.cashOut = true;
            }
        })

        this.saveUserCoin(userId);
        this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }]);
        this._userService.notice([{ username: userInfo.username, channelId: userInfo.channelId }]);
        this.unlockCoin(userId);

        //清空注单
        this.clearBetInfo(userId);
        //清空用户列表
        this._userInfos.splice(index, 1)
        this._channel.removeMember(userId.toString())

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
        const userbetInfos = this._betInfos.filter(e => e.userId === userId);
        let dels = [];
        userbetInfos.forEach(ue => {
            const index = this._betInfos.findIndex(b => b.userId === ue.userId)
            dels.push(index);
        })
        dels.forEach(d => {
            this._betInfos.splice(d, 1)
        })

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
        this.sendToUser(userId, 'syncProp_dice', { coin: userInfo.coin })
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
        this.sendToUser(userId, 'syncProp_dice', { coin: userInfo.coin })
        return true
    }
}
