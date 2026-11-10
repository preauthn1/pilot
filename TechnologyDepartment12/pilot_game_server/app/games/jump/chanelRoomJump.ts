import { cancelJob, Channel, scheduleJob, getLogger, BackendSession } from "pinus"
import { STATUS } from ".";
import { RecordService } from "../../services/recordService";
import { UserService } from "../../services/userService";
import { date2Number } from "../../util/time";
import * as https from "https";
import { randomNumber, randResult, smooth } from "./algorithm";
import { promisify } from "util";
import { bet_danQianBao, cancel_danQianBao, getBalanceNew, settle_danQianBao, resolveBetGameCode } from "../../util/HttpsUtil";
import { Application } from "pinus/lib/application";
import { crop } from "../../util/object";
import { getRandomNum } from "../../util/random";
import jumpControlConfig, { JumpControlConfig } from "./JumpControlConfig";
import jumpConfig, { JumpConfig } from "./JumpConfig";
import { WALLET_TYPE } from "../../consts/code";
const logger = getLogger("jump")

export default class ChannelRoomJump {
    private _roundId: number;
    private _status: STATUS;
    private _statusTime: number;
    private _running: boolean;
    private _syncPoints: number[];
    private _syncIndex: number;
    private _statusJob: number;
    private _statusJobTimeOut: NodeJS.Timer;
    private _userInfos: { merchantId: string, userId: number, username: string, coin: number, offline: boolean, channelId: number, gameCode: string, expand: string }[]
    private _betInfos: {
        userId: number, index: number, betCount: number, multiple: number, auto: boolean, inSettlement: boolean,
        cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, tag: string, afterCoin: number, refId: string, autoed: boolean, gameCode?: string
    }[];
    //手动下注
    private _robotBetInfos: { userId: number, username: string, index: number, betCount: number, multiple: number, auto: boolean, cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, tag: string, afterCoin: number }[];
    private _history: number[]
    // 加载数据的时候存在异步情况，为防止loading过程中玩家offline
    private _loading: number[];
    private _unloading: number[];
    private _updating: number[];
    private _channel: Channel;
    private _observer: Channel;
    private _userService: UserService
    private _recordService: RecordService
    private _controlConfig: JumpControlConfig
    private _gameConfig: JumpConfig
    private _setting: { notice: boolean, url: string }
    private _refId: { username: string, refId: string }[]
    private app: Application;
    private _walletType: number;
    channelID: number;
    constructor(app: Application, channelID: number, wallteType: number) {
        this.app = app;
        this.channelID = channelID;
        this._walletType = wallteType;
        this._channel = app.channelService.getChannel("game_member_jump_" + this.channelID, true)
        this._observer = app.channelService.getChannel("observer_member_jump_" + this.channelID, true)

        this._userService = app.get('userService')
        this._recordService = app.get('recordService')
        this._setting = app.get('setting')

        this._controlConfig = jumpControlConfig(app)
        this._gameConfig = jumpConfig(app)

        this._userInfos = [];
        this._userInfos = []
        this._loading = []
        this._updating = []
        this._betInfos = []
        this._robotBetInfos = []
        this._history = []
        this._unloading = []
        this._refId = []
        this._running = true;
        this.onStart()
    }

    get walletType() {
        return this._walletType;
    }

    openGame() {
        this._running = true;
    }

    offGame() {
        this._running = false;
    }

    userEnter(user: { userId: number, username: string, coin: number, offline: boolean, channelId: number, gameCode: string, expand: string, merchantId: string }) {
        let _u = this._userInfos.find(e => e.userId == user.userId)
        if (!_u) {
            this._userInfos.push(user);
        } else {
            _u = user;
        }

        if (!this._channel.getMember(user.userId.toString())) {
            const connectors = this.app.getServersByType('connector')
            this._channel.add(user.userId.toString(), connectors[0].id);
        }
    }

    async reconnect(userInfo: { userId: number, username: string, coin: number, offline: boolean, channelId: number, gameCode: string, expand: string, merchantId: string }) {
        const connectors = this.app.getServersByType('connector')

        userInfo.offline = false

        if (!this._channel.getMember(userInfo.userId.toString())) {
            this._channel.add(userInfo.userId.toString(), connectors[0].id);

            let balanceJson = await getBalanceNew(userInfo.username, userInfo.channelId, this._setting.url, userInfo.merchantId, userInfo.gameCode);
            // let balanceJson = JSON.parse(balanceStr);
            let coin: number;
            if (!balanceJson || balanceJson.code != 0) {
                coin = 0;
            } else {
                coin = parseFloat(balanceJson.data.balance);
            }
            userInfo.coin = coin;
        }

        let user = this._userInfos.find(u => u.userId == userInfo.userId)
        user = userInfo;
    }

    public getContext(userId: number) {
        // 根据状态同步不一样的数据
        const userInfo = this._userInfos.find(e => e.userId === userId)
        let statusData = null

        if (this._status === STATUS.RESULT) {
            statusData = {
                leftTime: Date.now() - this._statusTime
            }
        } else if (this._status === STATUS.WAIT) {
            let betList = []
            this._betInfos.forEach(e => {
                const userInfo = this._userInfos.find(e1 => e1.userId === e.userId)
                if (!userInfo) {
                    return
                }
                betList.push({ userId: e.userId, username: userInfo.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"), betCount: e.betCount })
            })
            this._robotBetInfos.forEach(e => {
                betList.push({ userId: e.userId, username: e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"), betCount: e.betCount })
            })
            statusData = {
                leftTime: Date.now() - this._statusTime,
                betList: betList
            }
        } else if (this._status === STATUS.GAME) {
            let betList = []
            this._betInfos.forEach(e => {
                const userInfo = this._userInfos.find(e1 => e1.userId === e.userId)
                if (!userInfo) {
                    return
                }
                betList.push({ userId: e.userId, username: userInfo.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"), betCount: e.betCount, cashOut: e.cashOut, multiple: e.multiple, index: e.index })
            })
            this._robotBetInfos.forEach(e => {
                betList.push({ userId: e.userId, username: e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"), betCount: e.betCount, cashOut: e.cashOut, multiple: e.multiple, index: e.index })
            })
            let syncPoint = this._syncPoints.slice(0, this._syncIndex)
            let betInfo = this._betInfos.filter(e => e.userId === userId)
            statusData = {
                betList: betList,
                syncPoint: syncPoint,
                betInfo: betInfo
            }
        }
        return { userInfo: crop(userInfo, 'offline'), history: this._history, status: this._status, statusData: statusData }
    }

    // 开始
    private onStart() {
        if (!this._running) {
            return
        }
        //可以下注了

        this._status = STATUS.WAIT
        this._roundId = date2Number(new Date())
        this._statusTime = Date.now()
        this._betInfos = []
        this._robotBetInfos = []
        this.sendToAll('statusJump', { status: this._status, duration: 6000, roundId: this._roundId })
        // const controls = this.app.getServersByType("control")
        // this.app.rpc.control.remote.robotBet.toServer(controls[0].id, 6000)
        this._statusJobTimeOut = setTimeout(() => {
            clearTimeout(this._statusJobTimeOut);
            this.onGame()
        }, 6000);
        // this._statusJob = scheduleJob({
        //     start: Date.now() + 6000,
        // }, () => {
        //     this.onGame()
        // })
    }

    // 广播消息
    private async sendToAll(route: string, msg: any) {
        this._observer.apushMessage(route, msg)
        if (route === 'betJump') {
            msg.username = msg.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        }
        return this._channel.apushMessage(route, msg)
    }

    // 发送数据给玩家
    public async sendToUser(userId: number, route: string, msg: any) {
        const member = this._channel.getMember(userId.toString())
        if (!member) {
            return
        }
        return this.app.channelService.apushMessageByUids(route, msg, [member])
    }

    // 游戏
    private async onGame() {
        //同步飞机数值
        this._status = STATUS.GAME
        this._statusTime = Date.now()
        this.sendToAll('statusJump', { status: this._status })
        //  let map = await this._controlConfig.getControlById(this.channelID).catch(err =>{});
        let map = await this._controlConfig.getControlById(this.channelID);
        let rebate = await this._controlConfig.finished(this.channelID) ? map.rebate : 1;

        const result = randResult(rebate);
        this._syncPoints = smooth(result)

        this._syncIndex = 0
        //每秒同步5次(200ms同步一次)
        // console.log("跳一跳渠道ID:", this.channelID);
        // console.log("跳一跳渠道配置,杀率:", map.rebate, "     最大结算倍数:", map.gamemax);
        // console.log("水池是否已满:", await this._controlConfig.finished(this.channelID), "     实际沙律:", rebate);

        this._statusJobTimeOut = setInterval(() => {
            let flag: boolean = false;
            if (map.gamemax > 0 && this._syncPoints[this._syncIndex] >= map.gamemax) {
                if (this.cashFull()) {
                    this._syncPoints.splice(this._syncIndex)
                    this._syncPoints[this._syncIndex] = randomNumber(this._syncPoints[this._syncIndex - 1], map.gamemax)
                    flag = true;
                }
            }
            const multiple = this._syncPoints[this._syncIndex]
            this._syncIndex += 1
            // 还是和cash out保持一致
            this.autoCashOut()
            // 发送结算信息
            this.sendToAll('syncPointJump', { multiple: multiple })

            if (flag) {
                clearInterval(this._statusJobTimeOut)
                this.onEnd(0, 0)
            } else {
                if (this._syncIndex == this._syncPoints.length) {
                    clearInterval(this._statusJobTimeOut)
                    this.onEnd(0, 0)
                }
            }
        }, 500);

        // this._statusJob = scheduleJob({
        //     start: Date.now() + 100,
        //     period: 500,
        //     count: this._syncPoints.length
        // }, () => {
        //     let flag: boolean = false;
        //     if (map.gamemax > 0 && this._syncPoints[this._syncIndex] >= map.gamemax) {
        //         if (this.cashFull()) {
        //             this._syncPoints.splice(this._syncIndex)
        //             this._syncPoints[this._syncIndex] = randomNumber(this._syncPoints[this._syncIndex - 1], map.gamemax)
        //             flag = true;
        //         }
        //     }
        //     const multiple = this._syncPoints[this._syncIndex]
        //     this._syncIndex += 1
        //     // 还是和cash out保持一致
        //     this.autoCashOut()
        //     // 发送结算信息
        //     this.sendToAll('syncPointJump', { multiple: multiple })

        //     if (flag) {
        //         cancelJob(this._statusJob)
        //         this.onEnd(0, 0)
        //     } else {
        //         if (this._syncIndex == this._syncPoints.length) {
        //             cancelJob(this._statusJob)
        //             this.onEnd(0, 0)
        //         }
        //     }
        // })
    }

    private cashFull() {
        for (let i = 0; i < this._betInfos.length; i++) {
            const element = this._betInfos[i];
            if (!element.cashOut) {
                return true;
            }
        }
        return false
    }

    public getUserInfo(userId: number) {
        return this._userInfos.find(e => e.userId === userId)
    }

    public async forceEnd(roundId: number, operatorId: number): Promise<boolean> {
        // cancelJob(this._statusJob)
        clearInterval(this._statusJobTimeOut)
        clearTimeout(this._statusJobTimeOut)
        await this.onEnd(1, operatorId)
        return true
    }

    // 结束
    private async onEnd(endType: number, operatorId: number) {
        this._status = STATUS.RESULT
        this._history.push(this._syncPoints[this._syncIndex - 1])
        if (this._history.length > 30) {
            this._history.splice(0, this._history.length - 30)
        }
        this._statusTime = Date.now();
        this.sendToAll('statusJump', { status: this._status, duration: 3000, endPoint: this._syncPoints[this._syncIndex - 1] })

        //延时开始下一局
        this._statusJobTimeOut = setTimeout(() => {
            clearTimeout(this._statusJobTimeOut);
            this.onStart()
        }, 3000);
        // this._statusJob = scheduleJob({
        //     start: Date.now() + 3000
        // }, () => {
        //     this.onStart()
        // })

        this._betInfos.forEach(e => {
            if (!e.cashOut) {
                let us = this._userInfos.find(d => d.userId === e.userId)
                settle_danQianBao(us.username, us.channelId, e.refId.toString(), 0, this._setting.url, us.merchantId, resolveBetGameCode(e.gameCode, us.gameCode))

            }
        })


        // 保存所有下过注的玩家金额
        //const userIds = await this.saveUserData()
        //查询渠道回调信息
        //this.notice(userIds)
        const roundReward = await this.getRoundReward()

        let saveTask = [
            this.saveGameRecord(endType, operatorId, roundReward).catch(err => { logger.warn(err) }),
            this.saveBetRecord().catch(err => logger.warn(err)),    //channel_id
            this.saveProgress(roundReward).catch(err => logger.warn(err))   //NaN
        ]
        //踢掉不在线玩家
        // let unlockTask = []
        // let notices = []
        // for (let i = this._userInfos.length - 1; i >= 0; i--) {
        //     if (this._userInfos[i].offline) {
        //         const userId = this._userInfos[i].userId
        //         notices.push({
        //             username: this._userInfos[i].username,
        //             channelId: this._userInfos[i].channelId
        //         })
        //         this._userInfos.splice(i, 1)
        //         unlockTask.push(this.unlockCoin(userId))
        //     }
        // }
        // if (unlockTask.length > 0) {
        //     await Promise.all(unlockTask)
        // }
        // //  this.noticeOffline(notices)
        // await Promise.all(saveTask)

        //-----------
        let unlockTask = [];
        let notices = [];
        let deIds = [];
        for (let i = this._userInfos.length - 1; i >= 0; i--) {
            if (this._userInfos[i].offline) {
                deIds.push(this._userInfos[i].userId);
                const userId = this._userInfos[i].userId;
                notices.push({
                    username: this._userInfos[i].username,
                    channelId: this._userInfos[i].channelId
                })
                unlockTask.push(this.unlockCoin(userId))
            }
        }

        deIds.forEach(id => {
            console.log("结算之后删除玩家:", id);
            let delIndex = this._userInfos.findIndex(user => user.userId == id);
            this._userInfos.splice(delIndex, 1);
        })
        if (unlockTask.length > 0) {
            await Promise.all(unlockTask)
        }
        //this.noticeOffline(notices)
        await Promise.all(saveTask)

    }

    private async unlockCoin(userId: number) {
        this._unloading.push(userId)
        // this._userService.unlockCoinById(userId)
        //     .catch(err => {
        //         logger.warn('unlock fail: ' + userId + ' error:' + err)
        //     }).finally(() => {
        //         const index = this._unloading.findIndex(e => e === userId)
        //         this._unloading.splice(index, 1)
        //     })
        const index = this._unloading.findIndex(e => e === userId)
        this._unloading.splice(index, 1)
    }

    // 计算当前局输赢
    private async getRoundReward() {
        // let progress = 0
        // this._betInfos.forEach(e => {
        //     e.cashOut ? progress -= (e.betCount * e.multiple / 100 - e.betCount) : progress += e.betCount
        // })

        // return progress

        let progress = 0
        this._betInfos.forEach(e => {
            e.cashOut ? progress += (e.betCount * e.multiple / 100 - e.betCount) : progress -= e.betCount
        })
        return progress
    }

    private autoCashOut() {
        if (this._syncIndex === 0) {
            return
        }
        if (this._syncPoints[this._syncIndex - 1] < 101) {
            return
        }
        this._robotBetInfos.forEach(e => {
            if (e.cashOut) {
                return
            }
            if (this._syncPoints[this._syncIndex - 1] >= e.multiple) {
                e.cashOut = true
                const reward = e.betCount * e.multiple / 100
                e.afterCoin = reward;
                e.finishTime = new Date()
                this.sendToAll('cashOutJump', { userId: e.userId, index: e.index, multiple: e.multiple, cashOut: reward })
            }
        })
        // 自动结算
        // 这里不合理  需要调整接口。从小飞机的角度讲，结算接口是一个可以传入多个用户ID的接口，而不是单个结算一直调用
        this._betInfos.forEach(async e => {
            if (e.cashOut) {
                return
            }
            if (!e.auto) {
                return
            }
            if (this._syncPoints[this._syncIndex - 1] >= e.multiple) {
                e.cashOut = true
                const userInfo = this._userInfos.find(u => u.userId === e.userId)
                if (!userInfo) {
                    return
                }
                const reward = e.betCount * e.multiple / 100;

                // let reward = betInfo.betCount * multiple / 100;
                //betInfo.inSettlement = true;
                // if (this._walletType == WALLET_TYPE.GONGXIANG) {
                //     let settleResult = await settle_danQianBao(userInfo.username, userInfo.channelId.toString(), e.refId, reward, this._setting.url);
                //     if (!settleResult || settleResult.code != 0)
                //         e.cashOut = false
                // }
                //let settleResult = await 
                settle_danQianBao(userInfo.username, userInfo.channelId.toString(), e.refId, reward, this._setting.url, userInfo.merchantId, resolveBetGameCode(e.gameCode, userInfo.gameCode));
                // if (!settleResult || settleResult.code != 0)
                //     e.cashOut = false

                userInfo.coin += reward
                e.afterCoin = userInfo.coin
                e.finishTime = new Date()

                this.sendToUser(userInfo.userId, 'autoCashOutJump', { index: e.index, multiple: e.multiple, cashOut: reward, coin: userInfo.coin })
                this.sendToAll('cashOutJump', { userId: userInfo.userId, index: e.index, multiple: e.multiple, cashOut: reward })
            }
        })

    }

    private async saveUserData(): Promise<number[]> {
        // 保存所有下过注的玩家金额
        let saveCoin = []
        this._betInfos.forEach(e => {
            if (saveCoin.includes(e.userId)) {
                return
            }
            saveCoin.push(e.userId)
        })
        let task = []
        saveCoin.forEach(e => {
            const userInfo = this._userInfos.find(e1 => e1.userId === e)
            task.push(this._userService.updateUserCoin(e, userInfo.coin).catch(err => {
                logger.warn(err)
                if (!userInfo.offline) {
                    this.akickByUserId(userInfo.userId, 'kick by coin update fail')
                }
            }))
        })
        if (task.length > 0) {
            await Promise.all(task)
        }
        return saveCoin
    }

    private async notice(userIds: number[]) {
        if (!this._setting.notice) {
            return
        }
        let channelInfos = []
        try {
            channelInfos = await this._userService.getChannelInfos()
        } catch (err) {
            logger.warn('get channel info fail' + err)
            return
        }
        https.get[promisify.custom] = function (url) {
            return new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    res.statusCode === 200 ? resolve(res.statusMessage) : reject(res.statusMessage)
                })
            })
        }
        const aget = promisify(https.get)
        let task = []
        userIds.forEach(e => {
            const userInfo = this._userInfos.find(e1 => e1.userId === e)
            if (!userInfo) {
                return
            }
            const channelInfo = channelInfos.find(e2 => e2.channelId === userInfo.channelId)
            if (!channelInfo || !channelInfo.notifyUrl) {
                return;
            }
            task.push(aget(channelInfo.notifyUrl + '?' + 'username=' + userInfo.username))
        })
        if (task.length > 0) {
            Promise.all(task).catch(e => {
                logger.warn('notice fail')
            })
        }
    }

    private async saveProgress(progress: number) {
        if (await this._controlConfig.finished(this.channelID)) {
            return true
        }
        return await this._controlConfig.saveProgress(progress, this.channelID);
    }

    // 用户下注记录入库
    private async saveBetRecord() {
        if (this._betInfos.length === 0 && this._robotBetInfos.length === 0) {
            return
        }

        let sqlParamArr = [];
        this.betInfos.forEach(e => {
            let sqlParam = [];
            let userInfo = this._userInfos.find(u => u.userId === e.userId);
            const payoutStr = (e.multiple / 100 * e.betCount).toFixed(0);
            sqlParam.push(userInfo.userId);     //'user_id,'
            sqlParam.push(userInfo.username);   //' user_name,' 
            sqlParam.push(this._roundId);       //'round_id,' 

            sqlParam.push(e.betCount);     // ' bet,' +
            sqlParam.push(e.auto);   // 'bet_type,'
            sqlParam.push(e.multiple);       //'settlement_multiple,' 

            sqlParam.push(parseInt(payoutStr));     //'pay_out,'
            sqlParam.push(e.betTime);   //' bet_time,' +
            sqlParam.push(e.finishTime);       //'finish_time,' +
            sqlParam.push(e.beforCoin);     //'before_coin,'
            sqlParam.push(userInfo.coin);   //' after_coin,' +
            sqlParam.push(userInfo.expand);       //'expand,' +

            sqlParam.push(e.tag);     //'tag,'   币种
            sqlParam.push(7);   //' game_tag,' 游戏类型
            sqlParam.push(this.channelID);       //'channel_id,'  渠道ID

            sqlParam.push(null);     //'betNo_str,'  赛车相关
            sqlParam.push(null);   //' betCount_str,' 赛车相关
            sqlParam.push(null);       //'win_car_num,' 赛车相关
            sqlParam.push(Math.floor(e.betTime.getTime() / 1000));       //时间戳
            sqlParam.push(new Date());                                   //created_at
            sqlParam.push(new Date());                                   //update_at

            sqlParamArr.push(sqlParam)
        })

        let robotSqlParam: any[] = null
        return await this._recordService.saveBetRecordNew(sqlParamArr, robotSqlParam);
    }

    // 游戏记录入库
    private async saveGameRecord(endType: number, operatorId: number, roundReward: number) {
        return this._recordService.saveGameRecord(roundReward, this._roundId, this._syncPoints[this._syncIndex - 1], endType, operatorId, this.channelID)
    }

    public async akickByUserId(userId: number, reason: string) {
        const connector = this.app.getServersByType('connector')
        let backendSessionService = this.app.backendSessionService
        let sessions: BackendSession[] = await backendSessionService.agetByUid(connector[0].id, userId.toString())
        // 玩家不在线
        if (!sessions || sessions.length !== 1) {
            return
        }
        await backendSessionService.akickByUid(connector[0].id, userId.toString(), reason)
    }

    public async bet(userId: number, index: number, betCount: number, auto: boolean, multiple: number, tag: string): Promise<boolean> {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        const betGameCode = userInfo.gameCode
        let refId = this.createRefId(userInfo.username, index)
        let afterCoin: number = 0;
        // if (this._walletType == WALLET_TYPE.GONGXIANG) {
        //     let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId.toString(), betCount, refId, this._setting.url);
        //     afterCoin = betJson.data.balance;
        //     if (!betJson || betJson.code != 0)
        //         return false;
        // } else {
        //     afterCoin = userInfo.coin - betCount
        // }

        let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId.toString(), betCount, refId, this._setting.url, userInfo.merchantId, betGameCode);
        afterCoin = betJson.data.balance;
        if (!betJson || betJson.code != 0)
            return false;
        userInfo.coin -= betCount
        this._betInfos.push({
            userId: userId,
            index: index,
            betCount: betCount,
            multiple: auto ? multiple : 0,
            auto: auto,
            cashOut: false,
            betTime: new Date(),
            finishTime: new Date(),
            beforCoin: userInfo.coin,
            tag: tag,
            afterCoin: 0,
            refId: refId,
            autoed: false,
            inSettlement: false,
            gameCode: betGameCode
        })
        this.sendToAll('betJump', { userId: userId, index: index, username: userInfo.username, betCount: betCount, tag: tag })
        return true
    }

    public async cancel(userId: number, index: number): Promise<boolean> {
        let betInfoIndex = this._betInfos.findIndex(e => e.userId === userId && e.index === index)
        if (betInfoIndex < 0) {
            return false
        }
        const betInfo = this._betInfos[betInfoIndex]
        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (!userInfo) {
            return false
        }



        // if (this._walletType == WALLET_TYPE.GONGXIANG) {
        //     let jiesuanJson = await cancel_danQianBao(userInfo.username, userInfo.channelId.toString(), betInfo.refId, betInfo.betCount, this._setting.url);
        //     if (!jiesuanJson || jiesuanJson.code != 0) {
        //         //订单取消
        //         return false;
        //     }
        // }

        let jiesuanJson = await cancel_danQianBao(userInfo.username, userInfo.channelId.toString(), betInfo.refId, betInfo.betCount, this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode));
        if (!jiesuanJson || jiesuanJson.code != 0) {
            //订单取消
            return false;
        }
        const betCount = betInfo.betCount
        userInfo.coin += betCount
        betInfoIndex = this._betInfos.findIndex(e => e.userId === userId && e.index === index);
        this._betInfos.splice(betInfoIndex, 1)
        //订单取消
        this.sendToAll('cancel', { userId: userId, index: index })
        return true

    }

    public async cashOut(userId: number, index: number): Promise<{ success: boolean; multiple: number; cashOut: number; }> {

        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (!userInfo) {
            return { success: false, multiple: 0, cashOut: 0 }
        }
        const betInfo = this._betInfos.find(e => e.userId === userId && e.index === index);
        if (!betInfo) {
            return
        }

        if (betInfo.index != index) {
            return;
        }

        if (this._syncIndex === 0) {
            return
        }
        if (betInfo.cashOut) {      //已经结算过了
            return
        }
        if (betInfo.inSettlement) { //正在结算中
            return
        }

        let multiple = this._syncPoints[this._syncIndex - 1];
        let reward = betInfo.betCount * multiple / 100;
        betInfo.inSettlement = true;
        let map = await this._controlConfig.getControlById(this.channelID);
        if (multiple > map.gamemax) {  //超过最大结算倍数，视为作弊
            multiple = 0;
            reward = 0;
        }
        settle_danQianBao(userInfo.username, userInfo.channelId.toString(), betInfo.refId, reward, this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode));
        // if (!jiesuanJson || jiesuanJson.code != 0) {
        //     //订单取消
        //     return { success: false, multiple: 0, cashOut: 0 }
        // }

        betInfo.cashOut = true
        betInfo.multiple = multiple
        betInfo.finishTime = new Date();
        betInfo.inSettlement = false;
        userInfo.coin += reward;
        betInfo.afterCoin = userInfo.coin;

        this.sendToAll('cashOutJump', { userId: userId, index: index, multiple: multiple, cashOut: reward })

        return { success: true, multiple: betInfo.multiple, cashOut: reward }


    }

    // 断线
    public async offline(userId: number) {
        // 加载数据中玩家掉线，直接解锁玩家数据
        const lIndex = this._loading.findIndex(e => e === userId)
        if (lIndex >= 0) {
            await this.unlockCoin(userId)//解锁   is_lock修改为0
            this._loading.splice(lIndex, 1)
            return
        }
        // 先查找玩家
        const index = this._userInfos.findIndex(e => e.userId === userId)
        if (index < 0) {
            return
        }
        const userInfo = this._userInfos[index]
        this._channel.removeMember(userId.toString())
        userInfo.offline = true
        if (this._status === STATUS.GAME) {
            let betTimes = this.betInfos.filter(e => e.userId == userId).length;
            if (betTimes > 0) {
                userInfo.offline = true
            } else {
                this._userInfos.splice(index, 1)
                await this.unlockCoin(userId)
                // this.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }])
            }
        } else if (this._status === STATUS.WAIT) {
            // 取消所有的订单
            const betinfos = this.betInfos.filter(e => e.userId == userId);
            betinfos.forEach(betInfo => {
                cancel_danQianBao(userInfo.username, userInfo.channelId.toString(), betInfo.refId, betInfo.betCount, this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode));
                betInfo.cashOut = true;
            })
            let bindex = this.betInfos.findIndex(e => e.userId == userId);
            while (bindex >= 0) {
                this.betInfos.splice(bindex, 1);
                bindex = this.betInfos.findIndex(e => e.userId == userId);
            }

            this.notice([userId])
            await this.unlockCoin(userId);
            console.log('    跳一跳玩家掉线，清除玩家       :', userId);
        } else {
            //结算阶段
  
            await this.unlockCoin(userId);
            this.notice([userId])
            console.log('    跳一跳玩家掉线，清除玩家       :', userId);
        }
        //this._userInfos.splice(index, 1);
        this._channel.removeMember(userId.toString());
        this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }]);
    }


    getCoin(userId: number) {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        return userInfo.coin
    }

    //  获取游戏状态
    public get status() {
        return this._status;
    }
    //  获取游戏局号
    public get roundId() {
        return this._roundId;
    }

    public get betInfos() {
        return this._betInfos;
    }


    /** 生成订单Id */
    private createRefId(username: string, index: number) {
        let newRefId = this._roundId + 'U' + username + '_' + index + '_' + getRandomNum(10, 99)
        //  this._refId.push({ username: username, refId: newRefId })
        //  console.log('创建订单:', newRefId)
        return newRefId
    }
}
