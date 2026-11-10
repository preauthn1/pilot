import { Channel, getLogger, BackendSession } from "pinus";
import aviator, { Aviator, STATUS } from ".";
import { RecordService } from "../../services/recordService";
import { UserService } from "../../services/userService";
import { date2Number, generateUniqueUuid } from "../../util/time";
import * as https from "https";
import { randResult, smooth } from "./algorithm";
import controlConfig, { ControlConfig } from "./controlConfig";
import gameConfig, { GameConfig } from "./gameConfig";
import { promisify } from "util";
import { bet_danQianBao, cancel_danQianBao, getBalanceNew, settle_danQianBao, freeBetUse, freeBetRecover, resolveBetGameCode } from "../../util/HttpsUtil";
import { Application } from "pinus/lib/application";
import { crop } from "../../util/object";
import { getRandomNum } from "../../util/random";
import { WALLET_TYPE } from "../../consts/code";
import { makeAviatorRoomKey } from "./roomIdentity";
const logger = getLogger("aviator")

export default class ChannelRoom {
    private _roundId: number;
    private _roundKey: string;
    private _status: STATUS;
    private _statusTime: number;
    private _running: boolean;
    private _syncPoints: number[];
    private _cashOutings: { userId: number, index: number }[];
    private _syncIndex: number;
    private _statusJob: number;
    private _statusJobTimeOut: NodeJS.Timer;
    private _userInfos: { merchantId: string, userId: number, username: string, coin: number, offline: boolean, channelId: number, gameCode: string, expand: string }[]
    private _betInfos: {
        userId: number, index: number, betCount: number, multiple: number, auto: boolean, inSettlement: boolean,
        cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, tag: string, afterCoin: number, refId: string, autoed: boolean, gameCode?: string,
        isFreeBet: boolean
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
    private _controlConfig: ControlConfig
    private _gameConfig: GameConfig
    private _setting: { notice: boolean, url: string }
    private _refId: { username: string, refId: string }[]
    private app: Application;
    channelID: number;
    private _walletType: number;
    private _currencyTag: string;
    private base: Aviator;
    private _rebate: number;
    private _nextRoundControlPromise: ReturnType<ControlConfig['reloadAndGet']>;
    readonly gameCode: string;
    readonly roomKey: string;
    constructor(app: Application, channelID: number, walletType: number, gameCode: string, currencyTag?: string) {
        this.app = app;
        this.channelID = channelID;
        this.gameCode = gameCode;
        this.roomKey = makeAviatorRoomKey(channelID, gameCode);
        this.base = aviator(app);
        this._walletType = walletType;
        this._currencyTag = '';
        this.updateCurrencyTag(currencyTag)
        // console.log("房间钱包类型:", this._walletType == WALLET_TYPE.GONGXIANG ? "共享钱包" : "转账钱包");

        this._channel = app.channelService.getChannel(`game_member_inter_${this.channelID}_${this.gameCode}`, true)
        this._observer = app.channelService.getChannel(`observer_member_inter_${this.channelID}_${this.gameCode}`, true)

        this._userService = app.get('userService')
        this._recordService = app.get('recordService')
        this._setting = app.get('setting')

        this._controlConfig = controlConfig(app)
        this._gameConfig = gameConfig(app)

        this._userInfos = [];
        this._userInfos = []
        this._loading = []
        this._updating = []
        this._betInfos = []
        this._robotBetInfos = []
        this._history = []
        this._unloading = []
        this._refId = []
        this._cashOutings = []
        this._running = true;
        this.onStart()
    }

    /**
     * A room belongs to a channel and game, while the currency tag belongs to
     * the current channel configuration and to individual bet records.
     */
    public updateCurrencyTag(tag?: string): void {
        const normalizedTag = typeof tag === 'string' ? tag.trim() : ''
        if (!normalizedTag) {
            return
        }
        this._currencyTag = normalizedTag
    }

    get walletType(): number {
        return this._walletType
    }

    openGame() {
        this._running = true;
    }

    offGame() {
        // this._running = false;
    }

    userEnter(user: { userId: number, username: string, coin: number, offline: boolean, channelId: number, gameCode: string, expand: string, merchantId: string }) {
        let _u = this._userInfos.findIndex(e => e.userId === user.userId)
        if (_u < 0) {
            this._userInfos.push(user);
        } else {
            this._userInfos[_u] = user;
        }
        const connectors = this.app.getServersByType('connector')
        if (this._channel.getMember(user.userId.toString())) {
            this._channel.removeMember(user.userId.toString());
        }

        this._channel.add(user.userId.toString(), connectors[0].id);

        const newArr = this._cashOutings.filter(function (item, index, arr) {
            return item.userId == user.userId;
        })
        newArr.forEach(n => {
            const delIndex = this._cashOutings.findIndex(c => c.index == n.index && c.userId == n.userId);
            this._cashOutings.splice(delIndex, 1);
        })
    }

    async reconnect(userInfo: { userId: number, username: string, coin: number, offline: boolean, channelId: number, gameCode: string, expand: string, merchantId: string }) {
        const connectors = this.app.getServersByType('connector')

        userInfo.offline = false;

        if (!this._channel.getMember(userInfo.userId.toString())) {
            this._channel.add(userInfo.userId.toString(), connectors[0].id);

            let balanceJson = await getBalanceNew(userInfo.username, userInfo.channelId, this._setting.url, userInfo.merchantId, userInfo.gameCode);
            // let balanceJson = JSON.parse(balanceStr);
            if (balanceJson && balanceJson.code == 0 && balanceJson.data && balanceJson.data.balance !== undefined) {
                userInfo.coin = parseFloat(balanceJson.data.balance);
            } else {
                const localCoin = await this._userService.getUserCoinById(userInfo.userId);
                if (localCoin !== null && localCoin !== undefined) {
                    userInfo.coin = localCoin;
                }
            }
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
                leftTime: Math.max(0, 3000 - (Date.now() - this._statusTime))
            }
        } else if (this._status === STATUS.WAIT) {
            let betList = []
            this._betInfos.forEach(e => {
                const userInfo = this._userInfos.find(e1 => e1.userId === e.userId)
                if (!userInfo) {
                    return
                }
                betList.push({ userId: e.userId, username: userInfo.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"), betCount: e.betCount, tag: e.tag })
            })
            this._robotBetInfos.forEach(e => {
                betList.push({ userId: e.userId, username: e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"), betCount: e.betCount, tag: e.tag })
            })
            statusData = {
                leftTime: Math.max(0, 6000 - (Date.now() - this._statusTime)),
                betList: betList
            }
        } else if (this._status === STATUS.GAME) {
            let betList = []
            this._betInfos.forEach(e => {
                const userInfo = this._userInfos.find(e1 => e1.userId === e.userId)
                if (!userInfo) {
                    return
                }
                betList.push({ userId: e.userId, username: userInfo.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"), betCount: e.betCount, cashOut: e.cashOut, multiple: e.multiple, index: e.index, tag: e.tag })
            })
            this._robotBetInfos.forEach(e => {
                betList.push({ userId: e.userId, username: e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"), betCount: e.betCount, cashOut: e.cashOut, multiple: e.multiple, index: e.index, tag: e.tag })
            })
            let syncPoint = this._syncPoints.slice(0, this._syncIndex)
            let betInfo = this._betInfos.filter(e => e.userId === userId)
            statusData = {
                betList: betList,
                syncPoint: syncPoint,
                syncSequence: this._syncIndex,
                betInfo: betInfo
            }
        }
        console.log("userInfo:", userInfo);
        console.log("userInfo: crop(userInfo, 'offline'):", crop(userInfo, 'offline'))
        //return { userInfo: crop(userInfo, 'offline'), history: this._history, status: this._status, statusData: statusData }
        return { userInfo: userInfo, history: this._history, status: this._status, statusData: statusData, roundId: this._roundId, roundKey: this._roundKey }
    }

    // 开始
    private onStart() {
        // if (!this._running) {
        //     return
        // }
        //可以下注了

        this._status = STATUS.WAIT
        this._roundId = generateUniqueUuid();//date2Number(new Date())
        this._roundKey = `${Date.now()}-${getRandomNum(100000, 999999)}`
        this._statusTime = Date.now()
        this._betInfos = []
        this._robotBetInfos = []
        this._nextRoundControlPromise = this.loadRoundControlConfig()
        this.sendToAll('status', { status: this._status, duration: 6000, roundId: this._roundId, roundKey: this._roundKey });
        const controls = this.app.getServersByType("control")
        this.app.rpc.control.remote.robotBet.toServer(controls[0].id, 6000, this.gameCode, this.channelID)

        this._statusJobTimeOut = setTimeout(() => {
            clearTimeout(this._statusJobTimeOut);
            this.onGame();
        }, 6000);

        // this._statusJob = scheduleJob({
        //     start: Date.now() + 6000,
        // }, () => {
        //     this.onGame()
        // })

    }

    private loadRoundControlConfig() {
        const roundKey = this._roundKey
        const startedAt = Date.now()
        return this._controlConfig.reloadAndGet(this.channelID, this.gameCode).then(config => {
            const duration = Date.now() - startedAt
            if (duration > 300) logger.warn('aviator control config load is slow', { roomKey: this.roomKey, roundKey, duration })
            return config
        }).catch(error => {
            logger.error('load aviator control config fail', { roomKey: this.roomKey, roundKey, error })
            return null
        })
    }

    // 广播消息
    public async sendToAll(route: string, msg: any) {
        this._observer.apushMessage(route, msg)
        if (route === 'bet') {
            msg.username = msg.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        }
        return this._channel.apushMessage(route, msg)
    }

    // 发送数据给玩家
    public async addObserver(observerId: number, serverId: string): Promise<boolean> {
        const uid = observerId.toString()
        if (this._observer.getMember(uid)) {
            this._observer.removeMember(uid)
        }
        const added = this._observer.add(uid, serverId)
        await this.syncObserver(observerId)
        return added
    }

    public removeObserver(observerId: number) {
        return this._observer.removeMember(observerId.toString())
    }

    private async sendToObserver(observerId: number, route: string, msg: any) {
        const member = this._observer.getMember(observerId.toString())
        if (!member) {
            return
        }
        return this.app.channelService.apushMessageByUids(route, msg, [member])
    }

    private async syncObserver(observerId: number) {
        if (this._status === undefined || this._status === null) {
            return
        }
        const msg: any = { status: this._status, roundKey: this._roundKey }
        if (this._status === STATUS.WAIT) {
            msg.duration = Math.max(0, 6000 - (Date.now() - this._statusTime))
            msg.roundId = this._roundId
            msg.roundKey = this._roundKey
        } else if (this._status === STATUS.RESULT) {
            msg.duration = Math.max(0, 3000 - (Date.now() - this._statusTime))
            msg.roundKey = this._roundKey
            if (this._syncPoints && this._syncIndex > 0) {
                msg.endPoint = this._syncPoints[this._syncIndex - 1]
            }
        }
        await this.sendToObserver(observerId, 'status', msg)
        if (this._status === STATUS.GAME && this._syncPoints && this._syncIndex > 0) {
            await this.sendToObserver(observerId, 'syncPoint', { multiple: this._syncPoints[this._syncIndex - 1], roundKey: this._roundKey, sequence: this._syncIndex })
        }
    }

    public async sendToUser(userId: number, route: string, msg: any) {
        const member = this._channel.getMember(userId.toString())
        if (!member) {
            return
        }
        return this.app.channelService.apushMessageByUids(route, msg, [member])
    }

    // 游戏
    private async onGame() {
        const controlPromise = this._nextRoundControlPromise
        this._nextRoundControlPromise = null
        const map = await (controlPromise || this.loadRoundControlConfig())
        if (!map) {
            logger.error('missing aviator control config before game', { roomKey: this.roomKey, roundKey: this._roundKey })
            this._nextRoundControlPromise = this.loadRoundControlConfig()
            this._statusJobTimeOut = setTimeout(() => this.onGame(), 1000)
            return
        }
        this._status = STATUS.GAME
        this._statusTime = Date.now()
        this.sendToAll('status', { status: this._status, roundId: this._roundId, roundKey: this._roundKey })
        // console.log("小飞机渠道配置,杀率:", map.rebate, "   最大结算倍数:", map.gamemax, "   map：", map);

        // Dynamic rebate is temporarily disabled; use the configured value directly.
        let rebate = 1;
        const configuredRebate = Number(map.rebate);
        if (Number.isInteger(configuredRebate) && configuredRebate >= 1 && configuredRebate <= 99) {
            rebate = configuredRebate;
        }

        //        // 动态杀率：根据当日盈利进度渐进调整，避免开局猛杀导致玩家流失
        //        let rebate = 1;
        //        if (shouldKill) {
        //            // 本局至少有一个真人玩家下了非免费注，杀率才生效；纯机器人局不杀
        //            const hasRealBet = this._betInfos.some(e => !e.isFreeBet);
        //            if (!hasRealBet) {
        //                rebate = 1;
        //            } else {
        //                const progressRatio = map.progress / map.reserve;
        //                let intensity: number;
        //                if (progressRatio < 0) {
        //                    // 庄家亏损：固定 85% 强度收复
        //                    intensity = 0.85;
        //                } else {
        //                    // 盈利区间：从 10%（开盘）到 100%（接近目标）线性增长
        //                    intensity = Math.min(0.1 + 0.9 * progressRatio, 1.0);
        //                }
        //                // ±15% 随机波动，避免被玩家识破固定模式
        //                const randomFactor = 0.85 + Math.random() * 0.3;
        //                const baseRebate = 1 + (map.rebate - 1) * intensity;
        //                rebate = Math.max(1, Math.min(99, Math.round(baseRebate * randomFactor)));
        //            }
        //        }

        this._rebate = rebate;
        const result = randResult(rebate);
        // logger.info('[调试] 小飞机本局原始爆点', {'原始倍率': result / 100});
        this._syncPoints = smooth(result)

        this._syncIndex = 0
        const gameMaxSyncPoints = this.getGameMaxSyncPoints(map.gamemax);
        //每秒同步5次(200ms同步一次)

        this._statusJobTimeOut = setInterval(() => {
            let flag: boolean = false;
            if (gameMaxSyncPoints > 0 && this._syncPoints[this._syncIndex] >= gameMaxSyncPoints) {
                if (this.cashFull()) {
                    this._syncPoints.splice(this._syncIndex)
                    this._syncPoints[this._syncIndex] = gameMaxSyncPoints
                    logger.info('[调试] 小飞机本局爆点被最大倍率截断', {'截断后倍率': this._syncPoints[this._syncIndex] / 100});
                    flag = true;
                }
            }
            const multiple = this._syncPoints[this._syncIndex]
            this._syncIndex += 1
            // 还是和cash out保持一致
            this.autoCashOut()
            // 发送结算信息
            this.sendToAll('syncPoint', { multiple: multiple, roundKey: this._roundKey, sequence: this._syncIndex })

            if (flag) {
                clearInterval(this._statusJobTimeOut)
                this.onEnd(0, 0)
            } else {
                if (this._syncIndex == this._syncPoints.length) {
                    clearInterval(this._statusJobTimeOut)
                    this.onEnd(0, 0)
                }
            }
        }, 200);


        // this._statusJob = scheduleJob({
        //     start: Date.now() + 100,
        //     period: 200,
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
        //     this.sendToAll('syncPoint', { multiple: multiple })

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

    private getGameMaxSyncPoints(gameMax: number): number {
        return gameMax > 0 ? gameMax * 100 : 0;
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

    private currentPoint(): number {
        if (!this._syncPoints || this._syncPoints.length === 0) {
            return 100
        }
        if (this._syncIndex <= 0) {
            return this._syncPoints[0] || 100
        }
        return this._syncPoints[Math.min(this._syncIndex - 1, this._syncPoints.length - 1)]
    }

    public async forceEnd(roundId: number, operatorId: number): Promise<boolean> {
        //cancelJob(this._statusJob)
        clearInterval(this._statusJobTimeOut)
        clearTimeout(this._statusJobTimeOut)
        await this.onEnd(1, operatorId)
        return true
    }

    // 结束
    private async onEnd(endType: number, operatorId: number) {
        this._status = STATUS.RESULT
        const endPoint = this.currentPoint()
        this._history.push(endPoint)
        if (this._history.length > 30) {
            this._history.splice(0, this._history.length - 30)
        } 
        this._statusTime = Date.now();
        this.sendToAll('status', { status: this._status, duration: 3000, endPoint: endPoint, roundId: this._roundId, roundKey: this._roundKey });

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
                e.multiple = 0;
                this.doCashOut(us.userId, e.index, 0,false);
                // settle_danQianBao(us.username, us.channelId.toString(), e.refId, 0, this._setting.url, us.merchantId);
            }
        })

        // 保存所有下过注的玩家金额
        //const userIds = await this.saveUserData()

        const roundReward = await this.getRoundReward();
        //
        let saveTask = [
            this.saveGameRecord(endType, operatorId, roundReward).catch(err => { logger.warn(err) }),
            this.saveBetRecord().catch(err => logger.warn(err)),    //channel_id
            this.saveProgress(roundReward).catch(err => logger.warn(err))   //NaN
        ]
        // 踢掉不在线玩家
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
            let userInfo = this._userInfos.find(user => user.userId == id);
            this._userInfos.splice(delIndex, 1);
            userInfo = null;
        })
        if (unlockTask.length > 0) {
            await Promise.all(unlockTask)
        }
        //this.noticeOffline(notices)
        await Promise.all(saveTask)
        // 查询渠道回调信息-----通知商户
        //this.notice(userIds)

    }

    // 结算
    private async doCashOut(userId: number, index: number, payOut: number,isAuto:boolean) {
        const user = this.getUserInfo(userId);
        let betInfo = this.betInfos.find(e => e.userId == userId && e.index == index);
        if (!user || !betInfo) {
            return;
        }
        this._cashOutings.push({ userId: userId, index: index });
        const settle = await settle_danQianBao(user.username, user.channelId.toString(), betInfo.refId, payOut, this._setting.url, user.merchantId, resolveBetGameCode(betInfo.gameCode, user.gameCode));
        return new Promise<void>((resolve, reject) => {          
            if (settle && settle.code == 0) {
                const delIndex = this._cashOutings.findIndex(d => d.userId == userId && d.index == index);
                user.coin += payOut;
                betInfo.afterCoin = user.coin;
                betInfo.finishTime = new Date()
                this._cashOutings.splice(delIndex, 1);
                if(isAuto){
                    this.sendToUser(user.userId, 'autoCashOut', { index: betInfo.index, multiple: betInfo.multiple, cashOut: payOut, coin: user.coin })
                    this.sendToAll('cashOut', { userId: user.userId, index: betInfo.index, multiple: betInfo.multiple, cashOut: payOut })
                    console.log("自动结算打印:", betInfo.multiple);
                }
                resolve();
            }else{
                reject();
            }
        })
    }

    settleCompleted(userId: number, index: number): boolean {
        return this._cashOutings.findIndex(d => d.userId == userId && d.index == index) < 0;
    }

    private async unlockCoin(userId: number) {
        this._unloading.push(userId)
        this._userService.unlockCoinById(userId)
            .catch(err => {
                logger.warn('unlock fail: ' + userId + ' error:' + err)
            }).finally(() => {
                const index = this._unloading.findIndex(e => e === userId)
                this._unloading.splice(index, 1)
            })
        const index = this._unloading.findIndex(e => e === userId)
        this._unloading.splice(index, 1)
    }

    // 计算当前局输赢
    /** 
     * 计算庄家当前局盈亏
     * progress > 0,代表当前局庄家赢
     * */
    private async getRoundReward() {
        let progress = 0
        this._betInfos.forEach(e => {
            if (e.isFreeBet) {
                // 免费下注：不影响渠道营收统计
                return;
            }
            e.cashOut ? progress -= (e.betCount * e.multiple / 100 - e.betCount) : progress += e.betCount
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
                e.afterCoin += reward;
                e.finishTime = new Date()
                this.sendToAll('cashOut', { userId: e.userId, index: e.index, multiple: e.multiple, cashOut: reward })
            }
        })
        // 自动结算
        // 这里不合理  需要调整接口。从小飞机的角度讲，结算接口是一个可以传入多个用户ID的接口，而不是单个结算一直调用

        this._betInfos.forEach(async e => {
            if (e.cashOut) {
                return
            }
            if (e.inSettlement) {
                return
            }
            if (!e.auto) {
                return
            }
            if (this._syncPoints[this._syncIndex - 1] >= e.multiple) {

                const userInfo = this._userInfos.find(u => u.userId === e.userId)
                if (!userInfo) {
                    return
                }
                e.cashOut = true
                const reward = e.betCount * e.multiple / 100;

                // if (this._walletType == WALLET_TYPE.GONGXIANG) {
                //     let settleResult = await settle_danQianBao(userInfo.username, userInfo.channelId.toString(), e.refId, reward, this._setting.url);
                //     if (!settleResult || settleResult.code != 0)
                //         e.cashOut = false
                // }
                //let settleResult = await
                this.doCashOut(userInfo.userId, e.index, reward,true);

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

    /** 通知商户 */
    private async notice(userIds: number[]) {
        //console.log("-------------this._setting.notice:", this._setting.notice);
        if (!this._setting.notice) {
            return
        }
        let channelInfos = []
        try {
            channelInfos = await this._userService.getChannelInfos()
        } catch (err) {
            logger.warn('------------------get channel info fail' + err)
            return
        }
        https.get[promisify.custom] = function (url) {
            console.log("https.get[promisify.custom]:", url);
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
        return await this._controlConfig.saveProgress(progress, this.channelID, this.gameCode);
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

            sqlParam.push(e.cashOut ? parseInt(payoutStr) : 0);     //'pay_out,'
            sqlParam.push(e.betTime);   //' bet_time,' +
            sqlParam.push(e.finishTime);       //'finish_time,' +

            sqlParam.push(e.beforCoin);     //'before_coin,'
            sqlParam.push(e.afterCoin);   //' after_coin,' +
            sqlParam.push(e.isFreeBet ? "free" : (userInfo.expand || "")); //'expand,' + (免费局标记为 "free")

            sqlParam.push(e.tag);     //'tag,'   币种
            sqlParam.push(1);   //' game_tag,' 游戏类型
            sqlParam.push(this.channelID);       //'channel_id,'  渠道ID
            sqlParam.push(this.gameCode);        //'game_code,'

            sqlParam.push(null);     //'betNo_str,'  赛车相关
            sqlParam.push(null);   //' betCount_str,' 赛车相关
            sqlParam.push(null);       //'win_car_num,' 赛车相关
            sqlParam.push(Math.floor(e.betTime.getTime() / 1000));       //时间戳
            sqlParam.push(new Date());                                   //created_at
            sqlParam.push(new Date());                                   //update_at

            sqlParamArr.push(sqlParam)
        })

        if (sqlParamArr.length === 0) {
            return
        }
        let robotSqlParam: any[] = null
        return await this._recordService.saveBetRecordNew(sqlParamArr, robotSqlParam);
    }

    // 游戏记录入库 
    private async saveGameRecord(endType: number, operatorId: number, roundReward: number) {
        return this._recordService.saveAviatorGameRecord(roundReward, this._roundId, this.currentPoint(), endType, operatorId, this.channelID, this.gameCode, this._rebate)
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

    // 机器人下注
    public robotBet(robotBetInfo: any): boolean {
        if (!this.bettingOpen) {
            return false
        }
        if (!this._currencyTag) {
            return false
        }
        if (robotBetInfo.betCount === 0) {
            return false
        }
        robotBetInfo.betTime = new Date()
        robotBetInfo.finishTime = new Date()
        robotBetInfo.beforCoin = 0
        robotBetInfo.afterCoin = 0
        robotBetInfo.tag = this._currencyTag

        this._robotBetInfos.push(robotBetInfo)
        this.sendToAll('bet', {
            userId: robotBetInfo.userId,
            index: robotBetInfo.index,
            username: robotBetInfo.username,
            betCount: robotBetInfo.betCount,
            tag: robotBetInfo.tag,
            isFreeBet: false,
        })
        return true
    }

    public async bet(userId: number, index: number, betCount: number, auto: boolean, multiple: number, tag: string, options?: { useFreeBet?: boolean, roundKey?: string }): Promise<boolean> {
        const userInfo = this._userInfos.find(e => e.userId === userId);
        const expectedRoundKey = options && options.roundKey
        if (!userInfo || !this.isBetRoundActive(expectedRoundKey)) {
            return false
        }
        const normalizedTag = typeof tag === 'string' ? tag.trim() : ''
        if (!normalizedTag) {
            return false
        }
        const betGameCode = userInfo.gameCode
        let refId = this.createRefId(userInfo.username, index);
        let isFreeBet = !!(options && options.useFreeBet);
        let balanceAfterBet = userInfo.coin

        if (isFreeBet) {
            // 方案A：免费下注 - 跳过 bet_danQianBao，不扣商户余额
            // userInfo.coin 保持不变（免费下注不扣用户余额）
            console.log("免费下注:", userInfo.username, betCount, refId);
            // 调用 Java 扣减免费次数（同步等待，确保扣减成功才创建注单）
            let useResult;
            try {
                useResult = await freeBetUse(userId, userInfo.channelId, refId, this._setting.url, betGameCode);
            } catch (err) {
                console.log("免费下注扣减次数异常:", err);
                return false;
            }
            if (!useResult || useResult.code !== 0) {
                console.log("免费下注扣减次数失败:", useResult);
                return false;
            }
            console.log("免费下注扣减次数成功");
        } else {
            let betJson = await bet_danQianBao(userInfo.username, userInfo.channelId.toString(), betCount, refId, this._setting.url, userInfo.merchantId, betGameCode);

            if (!betJson || betJson.code != 0){
                console.log("单钱包下注失败:",betJson);
                return false;
            }else{
                console.log("单钱包下注成功:",betJson);
            }
            
            balanceAfterBet = betJson.data.balance;
        }

        if (!this.isBetRoundActive(expectedRoundKey)) {
            await this.rollbackLateBet(userInfo, refId, betCount, isFreeBet, betGameCode)
            return false
        }

        userInfo.coin = balanceAfterBet
        
        this._betInfos.push({
            userId: userId,
            index: index,
            betCount: betCount,
            multiple: auto ? multiple : 0,
            auto: auto,
            cashOut: false,
            betTime: new Date(),
            finishTime: new Date(),
            beforCoin: userInfo.coin + (isFreeBet ? 0 : betCount),
            tag: normalizedTag,
            afterCoin: userInfo.coin,
            refId: refId,
            autoed: false,
            inSettlement: false,
            isFreeBet: isFreeBet,
            gameCode: betGameCode
        })

        this.sendToAll('bet', { userId: userId, index: index, username: userInfo.username, betCount: betCount, tag: normalizedTag, isFreeBet: isFreeBet })
        return true
    }

    private isBetRoundActive(roundKey: string): boolean {
        return this.bettingOpen && !!roundKey && roundKey === this._roundKey
    }

    private async rollbackLateBet(userInfo: { userId: number, username: string, channelId: number, merchantId: string }, refId: string, betCount: number, isFreeBet: boolean, gameCode: string): Promise<void> {
        try {
            const result = isFreeBet
                ? await freeBetRecover(userInfo.userId, userInfo.channelId, refId, this._setting.url)
                : await cancel_danQianBao(userInfo.username, userInfo.channelId.toString(), refId, betCount, this._setting.url, userInfo.merchantId, gameCode)
            if (!result || result.code != 0) {
                logger.error('rollback late aviator bet fail', { roomKey: this.roomKey, roundKey: this._roundKey, refId, result })
            }
        } catch (error) {
            logger.error('rollback late aviator bet error', { roomKey: this.roomKey, roundKey: this._roundKey, refId, error })
        }
    }

    public async updateAutoCashOut(userId: number, index: number, auto: boolean, multiple: number): Promise<{ success: boolean; settled: boolean; multiple?: number; cashOut?: number; }> {
        const betInfo = this._betInfos.find(e => e.userId === userId && e.index === index)
        if (!betInfo || betInfo.cashOut || betInfo.inSettlement) {
            return { success: false, settled: false }
        }

        betInfo.auto = auto
        betInfo.multiple = auto ? multiple : 0

        if (!auto || this._status !== STATUS.GAME || this._syncIndex === 0) {
            return { success: true, settled: false }
        }

        const currentMultiple = this._syncPoints[this._syncIndex - 1]
        if (currentMultiple < multiple) {
            return { success: true, settled: false }
        }

        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (!userInfo) {
            return { success: false, settled: false }
        }

        // Auto Cash Out 按用户设置的目标倍率结算，不按已经达到的当前倍率结算。
        const reward = betInfo.betCount * multiple / 100
        betInfo.inSettlement = true
        try {
            await this.doCashOut(userInfo.userId, betInfo.index, reward,false);
        } catch (e) {
            betInfo.inSettlement = false
            return { success: false, settled: false }
        }

        betInfo.cashOut = true
        betInfo.multiple = multiple
        betInfo.finishTime = new Date()
        betInfo.inSettlement = false
        this.sendToAll('cashOut', { userId: userId, index: index, multiple: multiple, cashOut: reward })
        return { success: true, settled: true, multiple: multiple, cashOut: reward }
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

        // 免费下注取消：恢复次数，不调商户 cancel
        if (betInfo.isFreeBet) {
            console.log("免费下注取消，恢复次数:", userInfo.username, betInfo.refId);
            freeBetRecover(userId, userInfo.channelId, betInfo.refId, this._setting.url).then(result => {
                if (result && result.code === 0) {
                    console.log("免费下注恢复次数成功");
                } else {
                    console.log("免费下注恢复次数失败:", result);
                }
            }).catch(err => {
                console.log("免费下注恢复次数异常:", err);
            });
            betInfoIndex = this._betInfos.findIndex(e => e.userId === userId && e.index === index);
            this._betInfos.splice(betInfoIndex, 1)
            this.sendToAll('cancel', { userId: userId, index: index })
            return true
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
        this.sendToAll('cancel', { userId: userId, index: index })
        return true
    }

    public async cashOut(userId: number, index: number): Promise<{ success: boolean; multiple: number; cashOut: number; }> {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (!userInfo) {
            return { success: false, multiple: 0, cashOut: 0 }
        }

        let betInfo = this._betInfos.find(e => e.userId === userId && e.index === index);
        if (!betInfo) {
            return { success: false, multiple: 0, cashOut: 0 }
        }

        if (betInfo.index != index) {
            return { success: false, multiple: 0, cashOut: 0 };
        }

        if (this._syncIndex === 0) {
            return { success: false, multiple: 0, cashOut: 0 }
        }
        if (betInfo.cashOut) {      //已经结算过了
            return { success: false, multiple: 0, cashOut: 0 }
        }
        if (betInfo.inSettlement) { //正在结算中
            return { success: false, multiple: 0, cashOut: 0 }
        }

        let multiple = this._syncPoints[this._syncIndex - 1];
        let reward = betInfo.betCount * multiple / 100;
        betInfo.inSettlement = true;
        let map = await this._controlConfig.getControlById(this.channelID, this.gameCode);
        const gameMaxSyncPoints = this.getGameMaxSyncPoints(map.gamemax);
        if (gameMaxSyncPoints > 0 && multiple > gameMaxSyncPoints) {  //超过最大结算倍数，视为作弊
            multiple = 0;
            reward = 0;
        }
        try {
            await this.doCashOut(userInfo.userId, betInfo.index, reward,false);
        } catch (e) {
            betInfo.inSettlement = false;
            return { success: false, multiple: 0, cashOut: 0 }
        }
        //settle_danQianBao(userInfo.username, userInfo.channelId.toString(), betInfo.refId, reward, this._setting.url, userInfo.merchantId);
        // if (!jiesuanJson || jiesuanJson.code != 0) {
        //     //订单取消
        //     return { success: false, multiple: 0, cashOut: 0 }
        // }

        betInfo.cashOut = true
        betInfo.multiple = multiple
        betInfo.finishTime = new Date();
        betInfo.inSettlement = false;
     

        console.log("小飞机发送结算结果");
        // this.sendToUser(userInfo.userId, 'autoCashOut', { index: betInfo.index, multiple: betInfo.multiple, cashOut: reward, coin: userInfo.coin })
        this.sendToAll('cashOut', { userId: userId, index: index, multiple: multiple, cashOut: reward })

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
        let userInfo = this._userInfos[index];
        userInfo.offline = true;
        this._channel.removeMember(userId.toString());
        if (this._status === STATUS.GAME) {
            //游戏中
            let betTimes = this.betInfos.filter(e => e.userId == userId).length;
            if (betTimes > 0) {
                userInfo.offline = true;//有下注，标注在线状态
            } else {
                this._userInfos.splice(index, 1)//无下注，清除玩家数据
                userInfo = null;
                await this.unlockCoin(userId)
                // this.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }])
            }
        } else if (this._status === STATUS.WAIT) {
            //下注中
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
            // this.cancel(userId, 1)
            // this.cancel(userId, 2)
            this._userInfos.splice(index, 1);
            userInfo = null;
            this.notice([userId])
            // await this.updateCoinAndUnlock(userInfo.userId, userInfo.coin, index)
            // this.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }])
            await this.unlockCoin(userId);
            console.log('    小飞机玩家掉线，清除玩家       :', userId);
        } else {
            //结算阶段
            await this.unlockCoin(userId);
            this.notice([userId])
            console.log('    小飞机玩家掉线，清除玩家       :', userId);
        }
        //this._userInfos.splice(index, 1);
        if (userInfo) {
            this.base.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }])
        }
    }

    getCoin(userId: number) {
        const userInfo = this._userInfos.find(e => e.userId === userId);
        return userInfo.coin
    }

    //  获取游戏状态
    public get status() {
        return this._status;
    }

    public get bettingOpen() {
        return this._status === STATUS.WAIT && Date.now() < this._statusTime + 6000
    }
    //  获取游戏局号
    public get roundId() {
        return this._roundId;
    }

    public get roundKey() {
        return this._roundKey;
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
        this.sendToUser(userId, 'syncProp', { coin: userInfo.coin })
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
        this.sendToUser(userId, 'syncProp', { coin: userInfo.coin })
        return true
    }

}
