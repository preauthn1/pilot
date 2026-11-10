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
import Car from "./Car";
import { getRandomNum, randomNum } from "../../util/random";
import { bet_danQianBao, cancel_danQianBao, getBalanceNew, settle_danQianBao } from "../../util/HttpsUtil";
import { channelRoomCar } from "./channelRoomCar";
import { ControlService } from "../../services/controlService";
import { WALLET_TYPE } from "../../consts/code";
const logger = getLogger("racing")

export enum STATUS {
    //等待
    WAIT,
    //开始
    GAME,
    //结束
    RESULT,
}

let racing: Racing = null

// 统一创建对象接口
export default function (app: Application) {
    if (racing === null) {
        racing = new Racing(app)
    }
    return racing
}

export class Racing {
    // 游戏状态
    private _roundId: number;
    private _status: STATUS;
    private _statusTime: number;
    private _running: boolean;
    private _syncPoints: number[];
    private _syncIndex: number;
    private _statusJob: number;
    private _userInfos: { merchantId:string,userId: number, username: string, coin: number, offline: boolean, channelId: number, gameCode: string, expand: string }[]
    //private _betInfos: { userId: number, index: number, betCount: number, multiple: number, auto: boolean, cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number }[];                                //手动下注
    //private _betInfos_car: { userId: number, data: [{ index: number, betCount: number, betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number }] }[]; //手动下注
    private _betInfos_car: {
        userId: number, username: string, data: { index: number, betCount: number }[], betTime: Date,
        finishTime: Date, beforCoin: number, afterCoin: number, betCount: number, payOut: number, tag: string, winNum: number
    }[]; //手动下注
    private _robotBetInfos: { userId: number, username: string, index: number, betCount: number, multiple: number, auto: boolean, cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number }[]
    private _robotBetInfos_car: {
        userId: number, username: string, data: { index: number, betCount: number }[],
        betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number, betCount: number, payOut: number, tag: string, winNum: number
    }[];
    private _allUBet: number;
    private _allBetInfo: { index: number, betCount: number }[];
    private _history: number[];
    private qqfc: { no: number, count: number }[];
    //{data:{index: number, betCount: number}[],allCount:number}
    // private _carBetInfos:{
    //     userId:number,data:[{index: number, betCount: number, betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number}]
    // }
    // [ {uid,[{bet,index,all}]} ]
    // 加载数据的时候存在异步情况，为防止loading过程中玩家offline
    private _loading: number[];
    private _unloading: number[];
    private _updating: number[];
    private _channel: Channel
    private _observer: Channel
    private _userService: UserService
    private _gameConfig: GameConfig
    private _setting: { notice: boolean, url: string }
    private _controService: ControlService;
    /* 渠道相关 */
    private _channelRooms: channelRoomCar[];
    constructor(private app: Application) {
        this._channel = app.channelService.getChannel("game_member_carIndex", true)
        this._observer = app.channelService.getChannel("observer_member_carIndex", true)
        this._userService = app.get('userService')
        this._controService = app.get('controlService')
        this._setting = app.get('setting')
        this._gameConfig = gameConfig(app)
        //初始化
        this._userInfos = []
        this._loading = []
        this._updating = []
        // this._betInfos = []
        this._robotBetInfos_car = [];
        this._history = []
        this._unloading = []
        this._allBetInfo = [];
        this._allUBet = 0;
        this.qqfc = [];
        for (let i = 0; i < 6; i++) {
            this.qqfc.push({
                no: (i + 1),
                count: 0
            })
        }
        this._channelRooms = [];
    }

    get channelRooms() {
        return this._channelRooms;
    }

    get gameConfig() {
        return this._gameConfig;
    }

    public run() {
        // if (this._running) {
        //     return
        // }
        console.log("------赛车启动------");
        
        for (let i = 0; i < 6; i++) {
            this._allBetInfo.push({ index: (i + 1), betCount: 0 });
        }
        this._running = true;
    }
    public get running() {
        return this._running
    }
    public stop() {
        if (!this._running) {
            return
        }
    //    this._running = false
    //    this._channelRooms.forEach(e => e.offGame())
    }
    // 广播消息
    public async sendToAll(route: string, msg: any) {
        this._observer.apushMessage(route, msg)
        if (route === 'car_bet') {
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
    public canReconnect(userId: number): boolean {
        // const userInfo = this._userInfos.find(e => e.userId === userId)
        // if (!userInfo) {
        //     return false
        // }
        // return userInfo.offline
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
    public reconnect(userId: number, gameCode: string) {
        // const connectors = this.app.getServersByType('connector')

        // userInfo.offline = false
        // this._channel.add(userId.toString(), connectors[0].id)
        const userInfo = this._userInfos.find(e => e.userId === userId)
        userInfo.gameCode = gameCode
        let room = this._channelRooms.find(e => e.channelId == userInfo.channelId)
        room.reconnect(userInfo);
    }

    getChannelRoom(userId: number) {
        const userInfo = this._userInfos.find(e => e.userId === userId);
        return this._channelRooms.find(e => e.channelId == userInfo.channelId)
    }

    // 玩家enter
    public async enter(userId: number, channelId: any, gameCode: string): Promise<boolean> {
        console.log("赛车玩家enterRequest:", 3);
        const connectors = this.app.getServersByType('connector')
        try {
            this._loading.push(userId)
            const userModal = await this._userService.loadUserInfo(userId)
            if (!this._loading.includes(userId)) {
                //解锁玩家数据
                //   await this._userService.unlockCoinById(userId)
                return false
            }

            let room = this._channelRooms.find(e => e.channelId == channelId)
            if (!room) {
                let walletType = await this._controService.getWalletType(channelId);
                room = new channelRoomCar(this.app, channelId, walletType);
                this.channelRooms.push(room)
            }

            let coin: number = 0;
            // if (room.walletType == WALLET_TYPE.ZHUAN) {
            //     console.log('       赛车玩家登录:', userModal)
            //     coin = await this._userService.getUserCoinById(userId);
            // } else {
            //     let balanceJson = await getBalanceNew(userModal.username, channelId, this._setting.url);
            //     // let balanceJson = JSON.parse(balanceStr);

            //     if (!balanceJson || balanceJson.code != 0) {
            //         coin = 0;
            //     } else {
            //         coin = parseFloat(balanceJson.data.balance);
            //     }
            // }
            let balanceJson = await getBalanceNew(userModal.username, channelId, this._setting.url,userModal.merchantId, gameCode);
            // let balanceJson = JSON.parse(balanceStr);

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
                channelId: channelId,
                gameCode: gameCode,
                expand: userModal.expand,
                blanceData: 0,
                merchantId:userModal.merchantId
            }
            console.log("赛车玩家数据:", userInfo);

            room.userEnter(userInfo);
            let i = this._userInfos.findIndex(u => u.userId == userId);
            if (i >= 0) {
                this._userInfos.splice(i, 1);
            }
            this._userInfos.push(userInfo);
            this._channel.add(userId.toString(), connectors[0].id)
            // this.getUserBlance(userId);
        } finally {
            const index = this._loading.findIndex(e => e === userId)
            this._loading.splice(index, 1)
        }


        return true
    }

    public async addObserver(observerId: number): Promise<boolean> {
        const controls = this.app.getServersByType('control')
        return this._observer.add(observerId.toString(), controls[0].id)
    }

    public async removeObserver(observerId: number) {
        return this._observer.removeMember(observerId.toString())
    }

    public getContext(userId: number) {
        // 根据状态同步不一样的数据
        const userInfo = this._userInfos.find(e => e.userId === userId);
        let room = this._channelRooms.find(e => e.channelId == userInfo.channelId)
        let obj = room.getContext(userId)
        return obj;
    }

    public getHistroy(userId: number){
        let room = this.getChannelRoom(userId);
        return room.history;
    }

    // 是否有足够的钱
    public getCoin(userId: number): number {
        let room = this.getChannelRoom(userId);
        return room.getCoin(userId);
    }
    // 当前下注次数
    public betTimes(userId: number) {
        return 0;//this._betInfos.filter(e => e.userId === userId).length
    }
    // 获取注单
    public getBet(userId: number) {
        let room = this.getChannelRoom(userId);
        return room.betInfos_car.find(e => e.userId === userId)
    }

    // 获取注单
    private getBetCarCount(userId: number, betIndex: number) {
        let userbet = this._betInfos_car.find(e => e.userId === userId);
        if (!userbet)
            return false;

        let arr: { index: number, count: number }[] = [];
        let flag = true;
        userbet.data.forEach(e => {
            let index = e.index;
            let add = true;
            if (index == betIndex) {
                flag = false;
            }
            arr.forEach(w => {
                if (w.index == index) {
                    w.count++;
                    add = false;
                }
            })
            if (add) {
                arr.push({ index: index, count: 1 });
            }
        })

        if (!flag) {
            return false;
        } else {
            return arr.length > 3;
        }
    }
    // bet
    // param   {data:{index: number, betCount: number}[],allCount:number}
    public async betCar(userId: number, data: { index: number, betCount: number }[], tag: string) {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        let room = this.getChannelRoom(userId);
        return await room.betCar(userId, data, tag)
    }

    // 机器人下注
    public robotBet(robotBetInfo: any): boolean {
        // if (this._status !== STATUS.WAIT) {
        //     return false
        // }

        // if (robotBetInfo.betCount === 0) {
        //     return false
        // }
        // let thisCarAllBetCount = 0;
        // for (let i = 0; i < this._allBetInfo.length; i++) {
        //     const element = this._allBetInfo[i];
        //     if (element.index == robotBetInfo.index) {
        //         element.betCount += robotBetInfo.betCount;
        //         thisCarAllBetCount = element.betCount;
        //         break;
        //     }
        // }
        // //console.log("thisCarAllBetCount:", thisCarAllBetCount);
        // robotBetInfo.betTime = new Date()
        // robotBetInfo.finishTime = new Date()
        // robotBetInfo.beforCoin = robotBetInfo.betCount
        // robotBetInfo.afterCoin = 0
        // robotBetInfo.data = [{
        //     index: robotBetInfo.index,
        //     betCount: robotBetInfo.betCount
        // }]
        // robotBetInfo.tag = "U";
        // this._robotBetInfos_car.push(robotBetInfo)
        // this.sendToAll('car_bet', {
        //     userId: robotBetInfo.userId, username: robotBetInfo.username,
        //     betData: [{ index: robotBetInfo.index, all: thisCarAllBetCount, self: 0, count: robotBetInfo.betCount }], betTime: new Date(), currency: "A"
        // });
        //this.sendToAll('car_bet', {data:{userId:robotBetInfo.userId,username:robotBetInfo.username,betData:[]}}); 
        return true
    }

    // 退出订单
    public async cancel(userId: number) {
        let room = this.getChannelRoom(userId);
        return room.cancel(userId);
    }

    public async getStatus(userId: number) {
        let room = this.getChannelRoom(userId);
        return room.status;
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

    // 断线
    public async offline(userId: number) {
        // 加载数据中玩家掉线，直接解锁玩家数据
        const lIndex = this._loading.findIndex(e => e === userId)
        if (lIndex >= 0) {
            await this.unlockCoin(userId)
            this._loading.splice(lIndex, 1)
            return
        }
        // 先查找玩家
        const index = this._userInfos.findIndex(e => e.userId === userId)
        if (index < 0) {
            return
        }

        let room = this.getChannelRoom(userId);
        room.offline(userId);
        this._userInfos.splice(index, 1);
        this._channel.removeMember(userId.toString());
    }

    roundIndexToStr(v): string {
        if (v < 10) {
            return "000" + v
        } else if (v < 100 && v >= 10) {
            return "00" + v
        } else if (v < 1000 && v >= 100) {
            return "0" + v
        } else {
            return "" + v
        }
    }

    public getUserInfo(userId: number) {
        return this._userInfos.find(e => e.userId === userId)
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

    private async noticeOffline(userInfos: { username: string, channelId: number }[]) {
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
            const channelInfo = channelInfos.find(e1 => e.channelId === e1.channelId)
            if (!channelInfo || !channelInfo.offlineUrl) {
                return;
            }
            task.push(aget(channelInfo.offlineUrl + '?' + 'username=' + e.username).catch(err => {
                logger.warn(e.username + ' notice offline fail: ' + err)
            }))
        })
        if (task.length > 0) {
            Promise.all(task).catch(e => {
                logger.warn('notice offline fail')
            })
        }
    }


    //


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
    // 提出所有玩家
    public async kickAll() {
        let task = []
        this._userInfos.forEach(e => {
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
        // this._betInfos = []
        this._userInfos = []
        if (task.length > 0) {
            return await Promise.all(task)
        }
        return []
    }

    public async increaseCoin(userId: number, coin: number): Promise<boolean> {

        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (!userInfo) {
            return false;
        }

        let room = this.getChannelRoom(userInfo.channelId)
        room.increaseCoin(userId, coin);
        return true  // 成功
    }

    public async decreaseCoin(userId: number, coin: number): Promise<boolean> {

        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (!userInfo) {
            return false;
        }

        let room = this.getChannelRoom(userInfo.channelId)
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
