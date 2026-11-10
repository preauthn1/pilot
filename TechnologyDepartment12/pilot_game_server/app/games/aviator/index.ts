import { Application, scheduleJob, Channel, BackendSession, getLogger } from "pinus";
import { UserService } from "../../services/userService";
import { RecordService } from "../../services/recordService";
import { crop } from "../../util/object";
import { randomNumber, randResult, smooth } from "./algorithm"
import { date2Number } from "../../util/time";
import controlConfig, { ControlConfig } from "./controlConfig";
import { cancelJob } from "pinus-scheduler";
import gameConfig, { GameConfig } from "./gameConfig";
import { promisify } from "util";
import * as https from "https";
import axios from "axios";
import e = require("cors");
import { getRandomNum } from "../../util/random";
import { bet_danQianBao, cancel_danQianBao, getBalanceNew, settle_danQianBao, resolveBetGameCode } from "../../util/HttpsUtil";
import ChannelRoom from "./chanelRoom";
import { ControlService } from "../../services/controlService";
import { WALLET_TYPE } from "../../consts/code";
import { makeAviatorRoomKey, normalizeAviatorGameCode } from "./roomIdentity";

const logger = getLogger("aviator")

export enum STATUS {
    //等待
    WAIT,
    //开始
    GAME,
    //结束
    RESULT,
}

export enum WALLET {
    //等待
    GONGXIANG,
    //开始
    HUAZHUAN,
}

let aviator: Aviator = null

// 统一创建对象接口
export default function (app: Application) {
    if (aviator === null) {
        aviator = new Aviator(app)
    }
    return aviator
}

export class Aviator {
    // 游戏状态
    private _roundId: number;
    private _status: STATUS;
    private _statusTime: number;
    private _running: boolean;
    private _syncPoints: number[];
    private _syncIndex: number;
    private _statusJob: number;
    private _userInfos: { merchantId:string, userId: number, username: string, coin: number, offline: boolean, channelId: number, gameCode: string, expand: string }[]
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
    private _channel: Channel
    private _observer: Channel
    private _observers: { observerId: number, gameCode: string }[]
    private _userService: UserService
    private _recordService: RecordService
    private _controlConfig: ControlConfig
    private _controService: ControlService;
    private _gameConfig: GameConfig
    private _setting: { notice: boolean, url: string }
    private _refId: { username: string, refId: string }[]

    /* 渠道相关 */
    private channelRooms: ChannelRoom[];


    constructor(private app: Application) {
        this._channel = app.channelService.getChannel("game_member_interIndex", true)
        this._observer = app.channelService.getChannel("observer_member_interIndex", true)
        this._userService = app.get('userService')
        this._recordService = app.get('recordService')
        this._controService = app.get('controlService')
        this._setting = app.get('setting')

        this._controlConfig = controlConfig(app)
        this._gameConfig = gameConfig(app)


        //初始化
        this._userInfos = []
        this._loading = []
        this._updating = []
        this._betInfos = []
        this._robotBetInfos = []
        this._history = []
        this._unloading = []
        this._refId = []
        this._observers = []
        this.channelRooms = [];
    }
    public run() {
        if (this._running) {
            return
        }
        this._running = true
        this.channelRooms.forEach(e => e.openGame())
        this._controlConfig.scheduleDailyReset()
        console.log("------星际穿越启动------");
    }
    public get running() {
        return this._running
    }
    public stop() {
        if (!this._running) {
            return
        }
       // this._running = false
        this.channelRooms.forEach(e => e.openGame());
    }
    private async resolveRoomCurrencyTag(channelId: number, requestedTag?: string): Promise<string | undefined> {
        const tag = typeof requestedTag === 'string' ? requestedTag.trim() : ''
        if (tag) return tag

        const configuredTag = await this._controService.getChannelCurrencyTag(channelId)
        if (configuredTag) return configuredTag

        logger.warn('aviator room has no currency tag', { channelId })
        return undefined
    }

    private async ensureChannelRoom(channelId: number, gameCode: string, currencyTag?: string): Promise<ChannelRoom> {
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        const roomKey = makeAviatorRoomKey(channelId, normalizedGameCode)
        if (!roomKey) {
            throw new Error('channelId and gameCode are required to create Aviator room')
        }
        const resolvedCurrencyTag = await this.resolveRoomCurrencyTag(channelId, currencyTag)
        let room = this.channelRooms.find(e => e.roomKey === roomKey)
        if (room) {
            room.updateCurrencyTag(resolvedCurrencyTag)
            return room
        }
        let walletType = await this._controService.getWalletType(channelId);
        room = this.channelRooms.find(e => e.roomKey === roomKey)
        if (room) {
            room.updateCurrencyTag(resolvedCurrencyTag)
            return room
        }
        room = new ChannelRoom(this.app, channelId, walletType, normalizedGameCode, resolvedCurrencyTag);
        this.channelRooms.push(room)
        await this.addObserversToRoom(room)
        return room
    }

    private async addObserversToRoom(room: ChannelRoom) {
        const controls = this.app.getServersByType('control')
        const observers = this._observers.filter(e => e.gameCode === room.gameCode)
        if (controls.length === 0 || observers.length === 0) {
            return
        }
        await Promise.all(observers.map(e => room.addObserver(e.observerId, controls[0].id)))
    }

    private async loadBalance(userModal: { userId: number, username: string, coin: number, merchantId: string }, channelId: number, gameCode: string): Promise<number> {
        try {
            const balanceJson = await getBalanceNew(userModal.username, channelId, this._setting.url, userModal.merchantId, gameCode)
            if (balanceJson && balanceJson.code == 0 && balanceJson.data && balanceJson.data.balance !== undefined) {
                return parseFloat(balanceJson.data.balance)
            }
            logger.warn('get balance fail, fallback to local coin:', balanceJson)
        } catch (err) {
            logger.warn('get balance error, fallback to local coin:', err)
        }
        const localCoin = await this._userService.getUserCoinById(userModal.userId)
        return localCoin === null || localCoin === undefined ? (userModal.coin || 0) : localCoin
    }

    public async sendToAll(route: string, msg: any) {
        this._observer.apushMessage(route, msg)
        if (route === 'bet') {
            msg.username = msg.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        }
        return this._channel.apushMessage(route, msg)
    }
    // 发送数据给玩家
    private async sendToUser(userId: number, route: string, msg: any) {
        const member = this._channel.getMember(userId.toString())
        if (!member) {
            return
        }
        return this.app.channelService.apushMessageByUids(route, msg, [member])
    }
    public canReconnect(userId: number, gameCode: string) {
        // const userInfo = this._userInfos.find(e => e.userId === userId)
        // if (!userInfo) {
        //     return false
        // }
        // return userInfo.offline

        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        const index = this._userInfos.findIndex(e => e.userId === userId && e.gameCode === normalizedGameCode);
        if (index >= 0) {
            this._userInfos.splice(index, 1);
        }
        return false
    }
    public unloading(userId: number): boolean {
        return this._unloading.includes(userId)
    }
    public loading(userId: number): boolean {
        return this._loading.includes(userId)
    }
    public updating(userId: number): boolean {
        return this._updating.includes(userId)
    }
    public async reconnect(userId: number, gameCode: string) {
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        const userInfo = this._userInfos.find(e => e.userId === userId && e.gameCode === normalizedGameCode);
        if (!userInfo) return false
        let room = this.channelRooms.find(e => e.channelID == userInfo.channelId && e.gameCode === normalizedGameCode)
        if (!room) return false
        await room.reconnect(userInfo);
        return true
    }

    public async sendToGame(gameCode: string, route: string, msg: any) {
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        if (!normalizedGameCode) return false
        await Promise.all(this.channelRooms
            .filter(room => room.gameCode === normalizedGameCode)
            .map(room => room.sendToAll(route, msg)))
        return true
    }

    getChannelRoom(userId: any, gameCode: string) {
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        const userInfo = this._userInfos.find(e => e.userId === userId && e.gameCode === normalizedGameCode);
        if (!userInfo) return null
        return this.channelRooms.find(e => e.channelID == userInfo.channelId && e.gameCode === normalizedGameCode)
    }

    // 玩家enter
    public async enter(userId: number, msg: { channelId: any, tag?: string }, gameCode: string): Promise<boolean> {
        try {
            const normalizedGameCode = normalizeAviatorGameCode(gameCode)
            if (!normalizedGameCode) {
                logger.error('enter game fail: missing gameCode', { userId })
                return false
            }
            if (!this._loading)
                this._loading = []
            this._loading.push(userId)
            const userModal = await this._userService.loadUserInfo(userId)
            const requestedChannelId = Number(msg.channelId)
            const channelId = requestedChannelId > 0 ? requestedChannelId : userModal.channelId
            if (!channelId) {
                logger.error('enter game fail: missing channelId', { userId, msg, userModal })
                return false
            }
            console.log('       interstellar玩家登录:', userModal, "  msg.channelId:", msg.channelId)
            let room = await this.ensureChannelRoom(channelId, normalizedGameCode, msg.tag)

            let coin: number;
            // if (room.walletType == WALLET_TYPE.ZHUAN) {   
            //     coin = await this._userService.getUserCoinById(userId);
            // } else {
            //     let balanceJson = await getBalanceNew(userModal.username, msg.channelId, this._setting.url);
            //     // let balanceJson = JSON.parse(balanceStr);
            //     if (!balanceJson || balanceJson.code != 0) {
            //         coin = 0;
            //     } else {
            //         coin = parseFloat(balanceJson.data.balance);
            //     }
            // }
            coin = await this.loadBalance(userModal, channelId, normalizedGameCode)

            console.log("玩家ID:", userId, "     金币:", coin);
            const userInfo = {
                userId: userModal.userId,
                username: userModal.username,
                coin: coin,
                offline: false,
                channelId: channelId,
                gameCode: normalizedGameCode,
                expand: userModal.expand,
                merchantId:userModal.merchantId
            }
            room.userEnter(userInfo);


            let i = this._userInfos.findIndex(uus => uus.userId == userId && uus.gameCode === normalizedGameCode);
            if (i >= 0) {
                this._userInfos[i] = userInfo;
            } else {
                this._userInfos.push(userInfo)
            }

        } catch (error) {
            logger.error('get userinfo error:', error)
            return false
        } finally {
            const index = this._loading.findIndex(e => e === userId)
            this._loading.splice(index, 1)
        }

        return true
    }

    public async addObserver(observerId: number, gameCode: string): Promise<boolean> {
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        if (!normalizedGameCode) return false
        const controls = this.app.getServersByType('control')
        if (controls.length === 0) {
            return false
        }
        const uid = observerId.toString()
        const serverId = controls[0].id
        if (!this._observers.some(e => e.observerId === observerId && e.gameCode === normalizedGameCode)) {
            this._observers.push({ observerId, gameCode: normalizedGameCode })
        }
        if (this._observer.getMember(uid)) {
            this._observer.removeMember(uid)
        }
        this._observer.add(uid, serverId)
        if (this.channelRooms.length === 0) {
            return true
        }
        const rooms = this.channelRooms.filter(room => room.gameCode === normalizedGameCode)
        const results = await Promise.all(rooms.map(room => room.addObserver(observerId, serverId)))
        return results.every(e => e)
    }

    public async removeObserver(observerId: number, gameCode: string) {
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        this._observers = this._observers.filter(e => e.observerId !== observerId || e.gameCode !== normalizedGameCode)
        this._observer.removeMember(observerId.toString())
        this.channelRooms.filter(room => room.gameCode === normalizedGameCode).forEach(room => room.removeObserver(observerId))
        return true
    }

    public getRoomByRoundId(roundId: number, gameCode: string): ChannelRoom {
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        return this.channelRooms.find(room => room.roundId == roundId && room.gameCode === normalizedGameCode)
    }

    public async forceEnd(roundId: number, operatorId: number, gameCode: string): Promise<boolean> {
        const room = this.getRoomByRoundId(roundId, gameCode)
        if (!room || room.status !== STATUS.GAME) {
            return false
        }
        return await room.forceEnd(roundId, operatorId)
    }

    public getContext(userId: number, gameCode: string) {
        // 根据状态同步不一样的数据
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        const userInfo = this._userInfos.find(e => e.userId === userId && e.gameCode === normalizedGameCode)
        if (!userInfo) return null


        let room = this.channelRooms.find(e => e.channelID == userInfo.channelId && e.gameCode === normalizedGameCode)
        let obj = room.getContext(userId)
        return obj;
    }

    //是否有未完成的结算
    settleCompleted(userId:number,index:number, gameCode: string):boolean{
        let room = this.getChannelRoom(userId, gameCode);
        return room.settleCompleted(userId,index);
    }

    // 是否有足够的钱
    public getCoin(userId: number, gameCode: string): number {
        let room = this.getChannelRoom(userId, gameCode);
        return room.getCoin(userId);
    }
    // 当前下注次数
    public betTimes(userId: number, gameCode: string) {
        let room = this.getChannelRoom(userId, gameCode);
        return room.betInfos.filter(e => e.userId === userId).length
    }
    // 获取注单
    public getBet(userId: number, index: number, gameCode: string) {
        let room = this.getChannelRoom(userId, gameCode);
        return room.betInfos.find(e => e.userId === userId && e.index === index)
    }

    // bet
    public async bet(userId: number, index: number, betCount: number, auto: boolean, multiple: number, tag: string, gameCode: string, options?: { useFreeBet?: boolean, roundKey?: string }): Promise<boolean> {
        let room = this.getChannelRoom(userId, gameCode);
        return await room.bet(userId, index, betCount, auto, multiple, tag, options)
    }

    public async updateAutoCashOut(userId: number, index: number, auto: boolean, multiple: number, gameCode: string): Promise<{ success: boolean; settled: boolean; multiple?: number; cashOut?: number; }> {
        let room = this.getChannelRoom(userId, gameCode);
        return await room.updateAutoCashOut(userId, index, auto, multiple)
    }

    // 机器人下注
    public robotBet(robotBetInfo: any, gameCode: string): boolean {
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        if (!normalizedGameCode) return false
        this.channelRooms.filter(room => room.gameCode === normalizedGameCode).forEach(room => room.robotBet({ ...robotBetInfo }));
        return true
    }

    // 退出订单
    public async cancel(userId: number, index: number, gameCode: string): Promise<boolean> {
        let room = this.getChannelRoom(userId, gameCode);
        return room.cancel(userId, index);
    }
    //
    public async cashOut(userId: number, index: number, gameCode: string): Promise<{ success: boolean; multiple: number; cashOut: number; }> {
        let room = this.getChannelRoom(userId, gameCode);
        return room.cashOut(userId, index)
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
                this.sendToAll('cashOut', { userId: e.userId, index: e.index, multiple: e.multiple, cashOut: reward })
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
                let settleResult = await settle_danQianBao(userInfo.username, userInfo.channelId.toString(), e.refId, reward, this._setting.url,userInfo.merchantId, resolveBetGameCode(e.gameCode, userInfo.gameCode));

                if (settleResult && settleResult.code == 0) {
                    userInfo.coin += reward
                    e.afterCoin = userInfo.coin
                    e.finishTime = new Date()

                    this.sendToUser(userInfo.userId, 'autoCashOut', { index: e.index, multiple: e.multiple, cashOut: reward, coin: userInfo.coin })
                    this.sendToAll('cashOut', { userId: userInfo.userId, index: e.index, multiple: e.multiple, cashOut: reward })
                }
            }
        })

    }

    // 断线
    public async offline(userId: number, gameCode: string) {
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        // 加载数据中玩家掉线，直接解锁玩家数据
        const lIndex = this._loading.findIndex(e => e === userId)
        if (lIndex >= 0) {
            await this.unlockCoin(userId)
            this._loading.splice(lIndex, 1)
            return
        }
        // 先查找玩家
        const index = this._userInfos.findIndex(e => e.userId === userId && e.gameCode === normalizedGameCode)
        if (index < 0) {
            return
        }
        let room = this.getChannelRoom(userId, normalizedGameCode);
        room.offline(userId);
        let userInfo = this._userInfos.find(e => e.userId === userId && e.gameCode === normalizedGameCode)
        this._userInfos.splice(index, 1);
        userInfo = null;
        this._channel.removeMember(userId.toString());
    }
    //  获取游戏状态
    public get status() {
        return this._status;
    }
    //  获取游戏局号
    public get roundId() {
        return this._roundId;
    }
    // 开始

    // 游戏

    public getUserInfo(userId: number, gameCode?: string) {
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        return this._userInfos.find(e => e.userId === userId && (!normalizedGameCode || e.gameCode === normalizedGameCode))
    }

    // 结束


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


    //     // 结束
    //     private async onEnd(endType: number, operatorId: number) {
    //         this._status = STATUS.RESULT
    //         this._history.push(this._syncPoints[this._syncIndex - 1])
    //         if (this._history.length > 30) {
    //             this._history.splice(0, this._history.length - 30)
    //         }
    //         this._statusTime = Date.now();
    //         this._betInfos.forEach(e => {
    //             if (!e.cashOut) {
    //                 let us = this._userInfos.find(d => d.userId === e.userId)
    //                 this._userService.axios_settle(us.username, us.channelId.toString(), 0, e.refId);
    //             }
    //         })

    public async noticeOffline(userInfos: { username: string, channelId: any }[]) {

        logger.warn('this is noticeOffline...........')

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
                    if (res.statusCode !== 200) {
                        reject(res.statusMessage)
                        return
                    }
                    res.on("data", (data) => {
                        let obj = JSON.parse(data.toString())
                        if (obj.code === 1) {
                            resolve('success')
                        } else {
                            reject('error code')
                        }
                    })
                }).on('error', err => {
                    reject(err)
                })
            })
        }
        const aget = promisify(https.get)
        let task = []
        userInfos.forEach(e => {
            const channelInfo = channelInfos.find(e1 => e.channelId == e1.channelId)
            logger.warn('!channelInfo || !channelInfo.offlineUrl:', channelInfo)
            if (!channelInfo || !channelInfo.offlineUrl) {
                return;
            }
            task.push(aget(channelInfo.offlineUrl + '?' + 'username=' + e.username).catch(err => {
                logger.warn(e.username + ' notice offline fail: ' + err)
            }).finally(() => {
                // logger.log('aget notice offline finally: ')
            }))
        })
        console.log("notice offline fail task.length :", task.length);
        if (task.length > 0) {
            Promise.all(task).catch(e => {
                //  logger.warn('notice offline fail')
            }).finally(() => {
                //  logger.warn('Promise notice offline finally: ')
            })
        }
    }

    public async akickByUserId(userId: number, reason: string) {
        const connector = this.app.getServersByType('connector')
        let backendSessionService = this.app.backendSessionService
        let sessions: BackendSession[] = await backendSessionService.agetByUid(connector[0].id, userId.toString())
        // 玩家不在线
        if (!sessions || sessions.length !== 1) {
            return
        }
        await backendSessionService.akickByUid(connector[0].id, userId.toString(), reason);
    }
    // 提出所有玩家
    public async kickAll(gameCode: string) {
        const normalizedGameCode = normalizeAviatorGameCode(gameCode)
        let task = []
        this._userInfos.filter(e => e.gameCode === normalizedGameCode).forEach(e => {
            task.push(this.akickByUserId(e.userId, 'kick by close server'))
        })
        return await Promise.all(task)
    }
    // 强制提出所有的玩家，关服的时候使用
    public async forceKickAll(): Promise<any[]> {
        let task = []
        this._userInfos.forEach(e => {
            task.push(this._userService.unlockCoinById(e.userId))
        })
        // 清空所有的注单和用户信息
        this._betInfos = []
        this._userInfos = []
        if (task.length > 0) {
            return await Promise.all(task)
        }
        return []
    }

    public async increaseCoin(userId: number, coin: number, gameCode: string): Promise<boolean> {

        if (this._updating.includes(userId)) {
            return false
        }
        const userInfo = this.getUserInfo(userId, gameCode)
        if (!userInfo) {
            return false;
        }

        let room = this.getChannelRoom(userId, gameCode)
        room.increaseCoin(userId, coin);
        return true  // 成功
    }

    public async decreaseCoin(userId: number, coin: number, gameCode: string): Promise<boolean> {
        if (this._updating.includes(userId)) {
            return false
        }
        const userInfo = this.getUserInfo(userId, gameCode)
        if (!userInfo) {
            return false;
        }

        let room = this.getChannelRoom(userId, gameCode)
        room.decreaseCoin(userId, coin);

        return true
    }

    private async updateCoinAndUnlock(userId: number, coin: number, delUserIndex) {
        this._unloading.push(userId)
        this._updating.push(userId)
        this._userService.updateCoinAndUnlock(userId, coin).catch(err => {
            logger.warn('unlock fail: ' + userId + ' error:' + err)
        }).finally(() => {
            const index = this._unloading.findIndex(e => e === userId)
            if (index >= 0) {
                this._unloading.splice(index, 1)
            }
            const index2 = this._updating.findIndex(e => e === userId)
            if (index2 >= 0) {
                this._updating.splice(index2, 1)
            }
            this._userInfos.splice(delUserIndex, 1)
        })
    }


}
