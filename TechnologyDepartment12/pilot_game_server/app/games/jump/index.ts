import { Application, BackendSession, cancelJob, Channel, getLogger, scheduleJob } from "pinus"
import { WALLET_TYPE } from "../../consts/code";
import { ControlService } from "../../services/controlService";
import { RecordService } from "../../services/recordService";
import { UserService } from "../../services/userService";
import { bet_danQianBao, getBalanceNew, settle_danQianBao } from "../../util/HttpsUtil";
import ChannelRoomJump from "./chanelRoomJump";
import jumpConfig, { JumpConfig } from "./JumpConfig";
import jumpControlConfig, { JumpControlConfig } from "./JumpControlConfig";
const logger = getLogger("Jump")
let jump: Jump = null
//import { ControlService } from "../../services/controlService";
export enum STATUS {
    //等待
    WAIT,
    //开始
    GAME,
    //结束
    RESULT,
}

// 统一创建对象接口
export default function (app: Application) {
    if (jump === null) {
        jump = new Jump(app)
    }
    return jump
}

export class Jump {
    private _channel: Channel;
    private _running: boolean;
    private _gameConfig: JumpConfig;
    private _loading: number[];
    private _unloading: number[];
    private _updating: number[];
    private _userService: UserService
    private _controService: ControlService;
    private _recordService: RecordService
    private _setting: { notice: boolean, url: string };
    private _controlConfig: JumpControlConfig;
    private _app: Application;

    private _userInfos: { merchantId:string,userId: number, username: string, coin: number, offline: boolean, channelId: number, gameCode: string, expand: string }[];
    private _betInfos: {
        userId: number, index: number, betCount: number, multiple: number, auto: boolean, inSettlement: boolean,
        cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, tag: string, afterCoin: number, refId: string, autoed: boolean
    }[];

    private channelRooms: ChannelRoomJump[];
    constructor(private app: Application) {
        this._app = app;
        this._controlConfig = jumpControlConfig(app)
        this._gameConfig = jumpConfig(app);
        this._channel = app.channelService.getChannel("game_member_jumpIndex", true)
        this._observer = app.channelService.getChannel("observer_member_jumpIndex", true)
        this._setting = app.get('setting');
        this._userService = app.get('userService')
        this._controService = app.get('controlService')
        this._recordService = app.get('recordService')

        this._userInfos = []
        this._loading = []
        this._updating = []
        this._betInfos = []
        this._unloading = []
        this.channelRooms = [];
      
    }

    public run() {
        if (this._running) {
            return
        }
        this._running = true
        this.channelRooms.forEach(e => e.openGame())
        console.log("------跳一跳启动------");
    }
    private _observer: Channel
    // 广播消息
    public async sendToAll(route: string, msg: any) {
        this._observer.apushMessage(route, msg)
        if (route === 'bet') {
            msg.username = msg.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        }
        return this._channel.apushMessage(route, msg)
    }

    // 发送数据给玩家
    public async sendToUser(userId: number, route: string, msg: any) {
        const member = this._channel.getMember(userId.toString())
        //  console.log("sendToUser  member is null:",!member);

        if (!member) {
            return
        }

        return this.app.channelService.apushMessageByUids(route, msg, [member])
    }

    public canReconnect(userId: number): boolean {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (!userInfo) {
            return false
        }
        return userInfo.offline
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
        const userInfo = this._userInfos.find(e => e.userId === userId);
        userInfo.gameCode = gameCode
        let room = this.channelRooms.find(e => e.channelID == userInfo.channelId)
        room.reconnect(userInfo);
    }

    getChannelRoom(userId: number) {
        const userInfo = this._userInfos.find(e => e.userId === userId);
        return this.channelRooms.find(e => e.channelID == userInfo.channelId)
    }

    // 玩家enter
    public async enter(userId: number, channelId: any, gameCode: string): Promise<boolean> {

        const connectors = this.app.getServersByType('connector')
        try {

            if (!this._loading)
                this._loading = []
            this._loading.push(userId)
            const userModal = await this._userService.loadUserInfo(userId)
            console.log("   jump channelId:",userModal);
            
            let room = this.channelRooms.find(e => e.channelID == channelId)
            if (!room) {
                
                const walletType = await this._controService.getWalletType(channelId);
                room = new ChannelRoomJump(this.app, channelId, walletType);
                this.channelRooms.push(room)
            }


            let coin: number;
            // if (room.walletType == WALLET_TYPE.ZHUAN) {
            //     console.log('       jump玩家登录:', userModal)
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

            console.log("玩家ID:", userId, "     金币:", coin);
            const userInfo = {
                userId: userModal.userId,
                username: userModal.username,
                coin: coin,
                offline: false,
                channelId: channelId,
                gameCode: gameCode,
                expand: userModal.expand,
                merchantId:userModal.merchantId
            }
            room.userEnter(userInfo);


            let i = this._userInfos.findIndex(uus => uus.userId == userId);
            if (i >= 0) {
                this._userInfos[i] = userInfo;
            } else {
                this._userInfos.push(userInfo)
            }


            // this._loading.push(userId)
            // const userModal = await this._userService.loadUserInfo(userId)
            // if (!this._loading.includes(userId)) {
            //     //解锁玩家数据
            //     //   await this._userService.unlockCoinById(userId)
            //     return false
            // }

            // console.log("============跳一跳登录成功:", userModal);

            // const userInfo = {
            //     userId: userModal.userId,
            //     username: userModal.username,
            //     coin: userModal.coin,
            //     offline: false,
            //     channelId: userModal.channelId,
            //     expand: userModal.expand,
            //     blanceData: 0,
            //     jumper: null,//new Jumper(userModal.userId,this),

            //     auto: true,
            //     amount: 0,
            //     count: 0,
            // }

            // let room = this.channelRooms.find(e => e.channelID == userModal.channelId)
            // if (room) {
            //     room.userEnter(userInfo);
            // } else {
            //     room = new ChannelRoomJump(this.app, userInfo.channelId);
            //     room.userEnter(userInfo);
            //     this.channelRooms.push(room)
            // }
            // console.log("============跳一跳登录成功:", userModal,"     房间数量:",this.channelRooms.length);
            // let i = this._userInfos.findIndex(u => u.userId == userId);
            // if (i >= 0) {
            //     this._userInfos.splice(i, 1);
            //     // userInfo.jack = this._userInfos[i].jack;
            //     //this._userInfos[i] = userInfo;
            // }
            // this._userInfos.push(userInfo);
            // //await this.getUserBlance(userId);
            // this._channel.add(userId.toString(), connectors[0].id);
            // this.getUserBlance(userId);
            return true
        } catch (error) {
            console.log('登录跳一跳没有成功:', error);
            return false
        } finally {
            const index = this._loading.findIndex(e => e === userId)
            this._loading.splice(index, 1)
        }

    }

    get status(): number {
        return this._status;
    }

    private _status: number;
    private _roundId: number;
    private _statusTime: number;
    private _robotBetInfos: any[];
    private _statusJob: number;
    private _syncPoints: number[];
    private _syncIndex: number;


    public getUserInfo(userId: number) {
        return this._userInfos.find(e => e.userId === userId)
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

    // 用户下注记录入库
    private async saveBetRecord() {
        if (this._betInfos.length === 0 && this._robotBetInfos.length === 0) {

            return
        }

        return await this._recordService.saveBetRecord(this._betInfos, this._userInfos, this._roundId, this._robotBetInfos, 7)
    }




    get running(): boolean {
        return this._running;
    }

    public stop() {
        if (!this._running) {
            return
        }
    //    this._running = false
        this.channelRooms.forEach(e => e.offGame())
    }


    public async bet(userId: number, index: number, betCount: number, auto: boolean, multiple: number, tag: string) {
        let room = this.getChannelRoom(userId);
        return await room.bet(userId, index, betCount, auto, multiple, tag)
    }


    // 游戏记录入库
    /**
     * @parma settlement 坐庄输赢
     * @parma roundId 订单号
     * @parma result 游戏结果
     */

    async saveGameRecord_jump(settlement: number, roundId: string, result: number, rebate: number = 0) {
        this._recordService.saveGameRecord_jump(settlement, roundId, result, 0, 0, rebate)
    }

    async saveBetRecord_jump(arr) {
        this._recordService.saveBetRecord_jump(arr)
    }

    // async saveProgress(progress) {
    //     if (this._controlConfig.finished()) {
    //         return true
    //     }
    //     return await this._controlConfig.saveProgress(progress)
    // }

    updateUserCoin(userId: number, coin: number) {
        let user = this._userInfos.find(e => e.userId == userId);
        if (user)
            user.coin = coin;
    }

    deleteBetInfoById(userId: number) {

        let index = this._betInfos.findIndex(e => e.userId === userId)
        // let index = this._betInfos.indexOf(userId);
        if (index > -1)
            this._betInfos.splice(index, 1);
    }

    saveUserRecord() {

    }

    public getContext(userId: number) {
        // 根据状态同步不一样的数据
        const userInfo = this._userInfos.find(e => e.userId === userId)


        let room = this.channelRooms.find(e => e.channelID == userInfo.channelId)
        let obj = room.getContext(userId)
        return obj;
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
    public getBet(userId: number, index: number) {
        let room = this.getChannelRoom(userId);
        return room.betInfos.find(e => e.userId === userId && e.index === index)
    }

    /**
     * cashOut
     */
    public async cashOut(userId: number, index: number) {
        let room = this.getChannelRoom(userId);
        return room.cashOut(userId, index)
    }

    // 退出订单
    public async cancel(userId: number, index = 0) {
        let room = this.getChannelRoom(userId);
        return room.cancel(userId, index);
    }

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

    deleteUserInfoById(userId: number) {
        let index = this._userInfos.findIndex(e => e.userId === userId);
        if (index >= 0) {
            this._userInfos.splice(index, 1);
            this._channel.removeMember(userId.toString())
        }
    };


    // 提出所有玩家
    public async kickAll() {
        let task = []
        this._userInfos.forEach(e => {
            task.push(this.akickByUserId(e.userId, 'kick by close server'))
        })
        return await Promise.all(task)
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

    getSeting(): { notice: boolean, url: string } {
        return this._setting;
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
