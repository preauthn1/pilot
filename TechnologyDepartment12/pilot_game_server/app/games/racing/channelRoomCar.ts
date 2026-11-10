import { Application, Channel, BackendSession, getLogger } from "pinus";
import { UserService } from "../../services/userService";
import { RecordService } from "../../services/recordService";
import { crop } from "../../util/object";
import controlConfig, { ControlConfig } from "./controlConfig";
import gameConfig, { GameConfig } from "./gameConfig";
import { promisify } from "util";
import * as https from "https";
import Car from "./Car";
import { bet_danQianBao, cancel_danQianBao, getBalanceNew, settle_danQianBao, resolveBetGameCode } from "../../util/HttpsUtil";
import { WALLET_TYPE } from "../../consts/code";
import { generateUniqueUuid } from "../../util/time";
import { getRandomNum } from "../../util/random";
const logger = getLogger("racing")

export enum STATUS {
    //等待
    WAIT,
    //开始
    GAME,
    //结束
    RESULT,
}


export class channelRoomCar {
    // 游戏状态
    private _roundId: number;
    private _status: STATUS;
    private _statusTime: number;
    private _running: boolean;
    private _syncPoints: number[];
    private _syncIndex: number;
    private _statusJob: number;
    private _statusJobTimeOut: NodeJS.Timer;
    private _walletType: number;
    private _userInfos: { merchantId: string, userId: number, username: string, coin: number, offline: boolean, channelId: number, gameCode: string, expand: string }[]
    //private _betInfos: { userId: number, index: number, betCount: number, multiple: number, auto: boolean, cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number }[];                                //手动下注
    //private _betInfos_car: { userId: number, data: [{ index: number, betCount: number, betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number }] }[]; //手动下注
    private _betInfos_car: {
        userId: number, username: string, data: { index: number, betCount: number }[], betTime: Date,
        finishTime: Date, beforCoin: number, afterCoin: number, betCount: number, payOut: number, tag: string, winNum: number, refId: string, gameCode?: string
    }[]; //手动下注
    private _robotBetInfos: { userId: number, username: string, index: number, betCount: number, multiple: number, auto: boolean, cashOut: boolean, betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number }[]
    private _robotBetInfos_car: {
        userId: number, username: string, data: { index: number, betCount: number }[],
        betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number, betCount: number, payOut: number, tag: string, winNum: number
    }[];
    private _allUBet: number;
    private _allBetInfo: { index: number, betCount: number }[];
    private _history: { roundid: string, carNum: number, payOut: number }[];
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
    private _cars: Car[];
    private _resultArr: { userId: number, resultArr: any[] }[];
    private _channel: Channel
    private _observer: Channel
    private _userService: UserService
    private _recordService: RecordService
    private _controlConfig: ControlConfig
    private _gameConfig: GameConfig
    private _winNum: number = -1;
    private _setting: { notice: boolean, url: string }
    private roundNumber: number;
    private mouth: number;
    private day: number;
    private year: number;
    private _gameTag: any;
    channelId;

    get betInfos_car() {
        return this._betInfos_car;
    }

    get walletType() {
        return this._walletType;
    }

    get history(){
        return this._history;
    }

    private createRefId(username: string) {
        let newRefId = this.dingdanID + 'U' + username + '_' + getRandomNum(10, 99)
        //  this._refId.push({ username: username, refId: newRefId })
        //  console.log('创建订单:', newRefId)
        return newRefId
    }


    constructor(private app: Application, channelId, _walletType: number) {
        this._walletType = _walletType;
        this.channelId = channelId;
        this._channel = app.channelService.getChannel("game_member_car" + this.channelId, true)
        this._observer = app.channelService.getChannel("observer_member_car" + this.channelId, true)
        this._userService = app.get('userService')
        this._recordService = app.get('recordService')
        this._setting = app.get('setting')
        this._cars = [new Car(3), new Car(6), new Car(2), new Car(5), new Car(4), new Car(1)];
        this._controlConfig = controlConfig(app)
        this._gameConfig = gameConfig(app)
        this._gameTag = app.get('serverTag').racing
        //初始化
        let speedArr = [235, 240, 245, 250, 255, 260];
        this._cars.forEach(e => e.setSpeedArr(speedArr))
        this._userInfos = []
        this._loading = []
        this._updating = []
        // this._betInfos = []
        this._robotBetInfos_car = [];
        this._history = []
        this._unloading = []
        this._allBetInfo = [];
        this._resultArr = [];
        this._allUBet = 0;
        this.qqfc = [];
        this._betInfos_car = [];
        for (let i = 0; i < 6; i++) {
            this.qqfc.push({
                no: (i + 1),
                count: 0
            })
        }
        this.run();
        console.log("赛车房间生成：", this.channelId);

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

    get gameConfig() {
        return this._gameConfig;
    }

    public run() {
        // if (this._running) {
        //     return
        // }
        for (let i = 0; i < 6; i++) {
            this._allBetInfo.push({ index: (i + 1), betCount: 0 });
        }
        this._running = true
        this.onStart()
    }

    public get running() {
        return this._running
    }
    public stop() {
        if (!this._running) {
            return
        }
        this._running = false
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

    public async addObserver(observerId: number): Promise<boolean> {
        const controls = this.app.getServersByType('control')
        return this._observer.add(observerId.toString(), controls[0].id)
    }

    public async removeObserver(observerId: number) {
        return this._observer.removeMember(observerId.toString())
    }

    private getBetList(): any[] {
        let betList = []
        this._betInfos_car.forEach(e => {
            const userInfo = this._userInfos.find(e1 => e1.userId === e.userId)
            if (!userInfo) {
                return
            }
            betList.push({ userId: e.userId, username: userInfo.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"), betData: e.data })
        })
        this._robotBetInfos_car.forEach(e => {
            betList.push({ userId: e.userId, username: e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2"), betData: e.data })
        })
        return betList;
    }

    public async getContext(userId: number) {
        // 根据状态同步不一样的数据
        let statusData = null
        const userInfo = this._userInfos.find(e => e.userId === userId);
        let betList = this.getBetList();
        let betInfo = this._betInfos_car.find(e => e.userId === userId)
        if (this._status === STATUS.RESULT) {

            let result = this._resultArr.find(e => e.userId == userId);
            statusData = {
                leftTime: Date.now() - this._statusTime,
                betInfo: betInfo ? betInfo.data : [],
                result: result ? result.resultArr : null,
                betList: betList,
                allBet: this._allBetInfo,
                roundId: this.roundId
            }
        } else if (this._status === STATUS.WAIT) {
            statusData = {
                leftTime: Date.now() - this._statusTime,
                betInfo: betInfo ? betInfo.data : [],
                betList: betList,
                allBet: this._allBetInfo,
                roundId: this.roundId
            }
        } else if (this._status === STATUS.GAME) {

            //   let syncPoint = this._syncPoints.slice(0, this._syncIndex)
            let cars = [];
            this._cars.forEach((e) => {
                cars.push({
                    carNum: e.carNum,
                    speed: e.speed,
                    duration: e.duration,
                    lap_len: e.progress,
                    isJiasu: e.isJisSu
                })
            })
            let cutTime = Date.now() - this.gameStartTime.getTime();

            let carInfo = [];
            this._cars.forEach(e => {

                let oobj = {
                    carNum: e.carNum,
                    data: e.gameInfo
                }
                carInfo.push(oobj);
            })

            statusData = {
                betList: betList,
                //    syncPoint: syncPoint,
                betInfo: betInfo ? betInfo.data : [],
                allBet: this._allBetInfo,
                cars: cars,
                gameData: { cutTime: cutTime, data: carInfo },
                roundId: this.roundId
            }
        }
        if (!this.gameConfig.lapLength || isNaN(this.gameConfig.lapLength)) {
            await this.gameConfig.load(this._gameTag);
        }
        let user = { userInfo: crop(userInfo, 'offline'), history: this._history, status: this._status, statusData: statusData, roadLen: this.gameConfig.lapLength };
        //console.log("enter user info :", user);
        return user;
    }

    // 是否有足够的钱
    public getCoin(userId: number): number {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        return userInfo.coin
    }
    // 当前下注次数
    public betTimes(userId: number) {
        return 0;//this._betInfos.filter(e => e.userId === userId).length
    }
    // 获取注单
    public getBet(userId: number) {
        return this._betInfos_car.find(e => e.userId === userId)
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
    private dingdanID: number;
    public async betCar(userId: number, data: { index: number, betCount: number }[], tag: string) {
        const userInfo = this._userInfos.find(e => e.userId === userId)
        let reqData: { index: number, all: number, self: number }[] = [];
        let thisCarAllBetCount = 0;
        //let selfBetOnThis = 0;
        let amount = 0;
        for (let i = 0; i < data.length; i++) {
            const onebetItem = data[i];
            // console.log("this._allBetInfo.length:",this._allBetInfo.length);

            for (let j = 0; j < this._allBetInfo.length; j++) {
                const element = this._allBetInfo[j];
                // console.log("_allBetInfo:",element);

                if (element.index == onebetItem.index) {
                    element.betCount += onebetItem.betCount;
                    thisCarAllBetCount = element.betCount;
                    break;
                }
            }
            reqData.push({
                index: onebetItem.index,
                self: onebetItem.betCount,
                all: thisCarAllBetCount
            })
            amount += onebetItem.betCount;
        }

        let afterCoin: number = userInfo.coin;

        const refId = this.createRefId(userInfo.username);
        const betGameCode = userInfo.gameCode
        let resData = await bet_danQianBao(userInfo.username, userInfo.channelId.toString(), amount, refId, this._setting.url, userInfo.merchantId, betGameCode);
        console.log("赛车下注,反馈:", resData);
        if (!resData || resData.code != 0)
            return false;
        userInfo.coin = resData.data.balance;



        let time = new Date();
        this.sendToAll('car_bet', { userId: userId, username: userInfo.username, betData: reqData, betTime: time, betCount: amount, currency: tag });
        this._betInfos_car.push({
            userId: userId,
            username: userInfo.username,
            data: data,
            betTime: time,
            finishTime: time,
            beforCoin: userInfo.coin,
            afterCoin: afterCoin,
            betCount: amount,
            payOut: 0,
            tag: tag,
            winNum: -1,
            refId: refId,
            gameCode: betGameCode
        })

        for (let i = 0; i < data.length; i++) {
            const onebetItem = data[i];
            this.qqfc[data[i].index - 1].count += onebetItem.betCount;
        }
        this._allUBet += amount;
        return true;
    }

    // 机器人下注
    public robotBet(robotBetInfo: any): boolean {
        if (this._status !== STATUS.WAIT) {
            return false
        }

        if (robotBetInfo.betCount === 0) {
            return false
        }
        let thisCarAllBetCount = 0;
        for (let i = 0; i < this._allBetInfo.length; i++) {
            const element = this._allBetInfo[i];
            if (element.index == robotBetInfo.index) {
                element.betCount += robotBetInfo.betCount;
                thisCarAllBetCount = element.betCount;
                break;
            }
        }
        //console.log("thisCarAllBetCount:", thisCarAllBetCount);
        robotBetInfo.betTime = new Date()
        robotBetInfo.finishTime = new Date()
        robotBetInfo.beforCoin = robotBetInfo.betCount
        robotBetInfo.afterCoin = 0
        robotBetInfo.data = [{
            index: robotBetInfo.index,
            betCount: robotBetInfo.betCount
        }]
        robotBetInfo.tag = "U";
        this._robotBetInfos_car.push(robotBetInfo)
        this.sendToAll('car_bet', {
            userId: robotBetInfo.userId, username: robotBetInfo.username,
            betData: [{ index: robotBetInfo.index, all: thisCarAllBetCount, self: 0, count: robotBetInfo.betCount }], betTime: new Date(), currency: "A"
        });
        //this.sendToAll('car_bet', {data:{userId:robotBetInfo.userId,username:robotBetInfo.username,betData:[]}}); 
        return true
    }

    // 退出订单
    public async cancel(userId: number) {
        console.log("赛车取消下注,钱包类型:", this.walletType);
        let delIndex = this._betInfos_car.findIndex(e => e.userId == userId)
        if (delIndex < 0) {
            return false
        }
        const userInfo = this._userInfos.find(e => e.userId == userId)
        if (!userInfo) {
            return false
        }

        let betInfo = this._betInfos_car.find(e => e.userId == userId);
        if (!betInfo) {
            return;
        }


        // if (this.walletType == WALLET_TYPE.GONGXIANG) {
        //     let resData = await cancel_danQianBao(userInfo.username, userInfo.channelId, this._roundId + "_" + userInfo.username, betInfo.betCount, this._setting.url);
        //     if (!resData || resData.code != 0) {
        //         return false;
        //     }
        //     userInfo.coin = resData.data.balance;
        // }

        let resData = await cancel_danQianBao(userInfo.username, userInfo.channelId, betInfo.refId, betInfo.betCount, this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode));
        if (!resData || resData.code != 0) {
            return false;
        }
        userInfo.coin = resData.data.balance;

        let delObj = this._betInfos_car[delIndex];
        this._betInfos_car.splice(delIndex, 1);
        userInfo.coin += betInfo.betCount;
        this.sendToAll('cancel_car', { userId: userId, data: delObj.data });
        return true;
    }
    //
    public cashOut(userId: number, index: number): { success: boolean, multiple: number, cashOut: number } {
        return { success: true, multiple: null, cashOut: null }
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
        if (this._status === STATUS.GAME) {
            let betTimes = this.betInfos_car.filter(e => e.userId == userId).length;
            if (betTimes > 0) {
                userInfo.offline = true
            } else {
                this._userInfos.splice(index, 1)
                await this.unlockCoin(userId)
                // this.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }])
            }
        } else if (this._status === STATUS.WAIT) {
            // 取消所有的订单
            this.cancel(userId)
            this._userInfos.splice(index, 1)
            this.notice([userId])
            // await this.updateCoinAndUnlock(userInfo.userId, userInfo.coin, index)
            // this.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }])
            await this.unlockCoin(userId);
            console.log('    赛车玩家掉线，清除玩家       :', userId);
        } else {
            this._userInfos.splice(index, 1)
            // await this.unlockCoin(userId, index)
            // this.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }])
            await this.unlockCoin(userId);
            this.notice([userId])
            console.log('    赛车玩家掉线，清除玩家       :', userId);
        }
        //this._userInfos.splice(index, 1);

        this._channel.removeMember(userId.toString());
        this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }])
    }
    //  获取游戏状态
    public get status() {
        return this._status;
    }
    //  获取游戏局号
    public get roundId() {
        return this._roundId;
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

    // 开始
    private async onStart() {
        // if (!this._running) {
        //     return
        // }
        //可以下注了
        this.gameTime = await this.gameConfig.getGameTimeByChannel(this.channelId);
        let redayTime: number = 12000;
        this._status = STATUS.WAIT
        let dat = new Date;
        if (dat.getDate() === this.day && dat.getMonth() + 1 === this.mouth && dat.getFullYear() == this.year) {
            this.roundNumber++;
        } else {
            this.day = dat.getDate();
            this.mouth = dat.getMonth() + 1;
            this.year = dat.getFullYear();
            this.roundNumber = 1;
        }

        let m = this.mouth >= 10 ? this.mouth + "" : "0" + this.mouth;
        let d = this.day > 10 ? this.day + "" : "0" + this.day;

        let roundStr = m + "" + d + this.roundIndexToStr(this.roundNumber)
        this._roundId = parseInt(roundStr);

        this._statusTime = Date.now();
        this._frameIndex = 0;
        this._resultArr = [];
        this._allUBet = 0;
        this.qqfc.forEach(e => {
            e.count = 0;
        })
        //  this._betInfos = []     //玩家下注
        this._betInfos_car = [];
        this._robotBetInfos_car = []    //机器人下注
        for (let i = 0; i < this._allBetInfo.length; i++) {
            const element = this._allBetInfo[i];
            element.betCount = 0;
        }

        // if(this.channelId == 10169 || this.channelId == "10169" || this.channelId == 10195 || this.channelId == "10195"){//10169 10195

        // }else{
        //     if (this.gameTime && !isNaN(this.gameTime[0]) && !isNaN(this.gameTime[1])) {
        //         redayTime = this.gameTime[1] * 1000;
        //     }
        // }

        redayTime = 300000;

        this.sendToAll('status', { status: this._status, duration: redayTime, roundId: this._roundId })

        const controls = this.app.getServersByType("control")
        this.app.rpc.control.remote.robotBet_racing.toServer(controls[0].id, redayTime)//机器人下注

        this._statusJobTimeOut = setTimeout(() => {
            clearTimeout(this._statusJobTimeOut);
            this.onGame()
        }, redayTime);
        // this._statusJob = scheduleJob({
        //     start: Date.now() + 12000,
        // }, () => {
        //     this.onGame()
        // })
    }
    private _frameIndex: number;
    private _rebate: number;
    private gameStartTime: Date;
    private gameTime: number[];
    private async onGame() {
        //同步飞机数值
        this._status = STATUS.GAME
        this._statusTime = Date.now()

        // this._controlConfig.rebate;
        let map = await this._controlConfig.getControlById(this.channelId);

        this._rebate = map.rebate;
        console.log("-----------------赛车杀率---------:", this._rebate);
        this._syncIndex = 0;
        this._winNum = -1;
        this.dingdanID = generateUniqueUuid();
        if (this._rebate >= 1 && this._rebate <= 6) {
            this._cars.forEach((e) => {
                e.run = true;
                e.canChangeSpeed = true;
                e.isW = e.carNum == this._rebate;
            })
            //  let rest = await this._controlConfig.restRacingRate(this.channelId);

        } else {
            let w = [];//不能赢
            this.qqfc.forEach(e => {
                if (e.count * 5.9 > this._allUBet) {
                    //let i = randomNum(1, 10);
                    //if (i >= this._rebate * 10)
                    w.push(e.no);
                }
            })

            this._cars.forEach((e) => {
                e.run = true;
                e.canChangeSpeed = true;
                e.isW = true;
                for (let i = 0; i < w.length; i++) {
                    const element = w[i];
                    if (element == e.carNum) {
                        e.isW = false;
                    }
                }
                //  e.isW = w.find(e)
            })
        }

        //log("=============game is start================");  pinus restart "racing-server"

        let gameTime = 8000000000;
        let carInfo = [];

        if (!this.gameConfig.lapLength || isNaN(this.gameConfig.lapLength)) {
            await this.gameConfig.load(this._gameTag);
        }
      //  console.log("游戏时间:", gameTime, "   配置:", this.gameConfig.lapLength);
        this._cars.forEach(e => {
            let time = e.runHandler(this.gameConfig.lapLength);
            if (time < gameTime) {
                gameTime = time;
                this._winNum = e.carNum;
            }
            let oobj = {
                carNum: e.carNum,
                data: e.gameInfo
            }
            carInfo.push(oobj);
        })
        this.gameStartTime = new Date;
        this.sendToAll('gameBegin', { data: carInfo, cutTime: 0 });
        this.sendToAll('status', { status: this._status })


        this._statusJobTimeOut = setTimeout(() => {
            clearTimeout(this._statusJobTimeOut);
            this.sendToAll('gamesssEnd', { data: "geme is end", winNum: this._winNum });
            this._cars.forEach((e) => {
                e.progress = 0;
            })
            //log("=============game is end================");
            let hisWinCount: number = 0;
            this._betInfos_car.forEach(async betInfo => {
                let userId = betInfo.userId;
                let resultArr: { carNum: number, betCount: number, win: number, isWin: boolean }[] = [];
                let user = this._userInfos.find(e => e.userId === userId);
                if (user) {
                    let rewardAmount = 0;
                    betInfo.data.forEach(e => {
                        if (e.index == this._winNum) {
                            rewardAmount += e.betCount * 5.9;
                            //user.coin += e.betCount * 5.9;
                            //e.afterCoin = user.coin;
                            resultArr.push({
                                carNum: e.index,
                                betCount: e.betCount,
                                win: e.betCount * 5.9,
                                isWin: true
                            })
                            betInfo.payOut = rewardAmount;
                        } else {
                            resultArr.push({
                                carNum: e.index,
                                betCount: e.betCount,
                                win: 0,
                                isWin: false
                            })
                        }
                    })
                    hisWinCount += rewardAmount;
                    // if (this.walletType == WALLET_TYPE.GONGXIANG) {
                    //     //console.log("单钱包派彩反馈：",user.username,user.channelId,this._roundId + "_" + user.username,rewardAmount);
                    //     settle_danQianBao(user.username, user.channelId, this._roundId + "_" + user.username, rewardAmount, this._setting.url).then((e) => {
                    //         //console.log("单钱包派彩反馈：",e);
                    //         //let edata = JSON.parse(e);
                    //         if (e.code != 0) {
                    //             logger.warn("赛车单钱包结算失败:", e);
                    //             // return;
                    //         }
                    //     }).catch((e) => {
                    //         logger.warn(e);
                    //     });
                    // }
                    //console.log("单钱包派彩反馈：",user.username,user.channelId,this._roundId + "_" + user.username,rewardAmount);
                    settle_danQianBao(user.username, user.channelId, betInfo.refId, rewardAmount, this._setting.url, user.merchantId, resolveBetGameCode(betInfo.gameCode, user.gameCode)).then((e) => {
                        //console.log("单钱包派彩反馈：",e);
                        //let edata = JSON.parse(e);
                        if (e.code != 0) {
                            logger.warn("赛车单钱包结算失败:", e);
                            // return;
                        }
                    }).catch((e) => {
                        logger.warn(e);
                    });

                    user.coin += rewardAmount;
                    this.sendToUser(userId, 'roundResult', { result: resultArr, coin: user.coin });

                    let oobj = {
                        userId: user.userId,
                        resultArr: resultArr
                    }
                    this._resultArr.push(oobj);
                    betInfo.afterCoin = user.coin + rewardAmount;
                    betInfo.payOut = rewardAmount;
                    betInfo.winNum = this._winNum;
                }
            })

            this._history.push({ roundid: this._roundId + "", carNum: this._winNum, payOut: hisWinCount })

            if (this._history.length > 30) {
                this._history.splice(0, this._history.length - 30)
            }
            this.onEnd(0, 0);
        }, gameTime);

    }

    public getUserInfo(userId: number) {
        return this._userInfos.find(e => e.userId === userId)
    }

    public async forceEnd(roundId: number, operatorId: number): Promise<boolean> {
        //cancelJob(this._statusJob)
        clearTimeout(this._statusJobTimeOut)
        await this.onEnd(1, operatorId)
        return true
    }

    // 结束
    /**
     * @param endType  0--正常结束,1---暴力结束
     * @param operatorId
     */
    private async onEnd(endType: number, operatorId: number) {
        this._status = STATUS.RESULT

        this._statusTime = Date.now()
        this.sendToAll('status', { status: this._status, duration: 6000 })

        //延时开始下一局
        this._statusJobTimeOut = setTimeout(() => {
            clearTimeout(this._statusJobTimeOut);
            this.onStart()
        }, 6000);


        // 保存所有下过注的玩家金额
        //const userIds = await this.saveUserData_racing();
        // 查询渠道回调信息
        //this.notice(userIds)
        //当前局的输赢
        const roundReward = await this.getRoundReward()
        let saveTask = [this.saveGameRecord_racing(endType, operatorId, roundReward).catch(err => { logger.warn(err) }),//游戏记录
        this.saveBetRecord_racing().catch(err => logger.warn(err)),    //玩家下注-成绩记录
        this.saveProgress(roundReward).catch(err => logger.warn(err))]  //水池
        // 踢掉不在线玩家
        let unlockTask = []
        let notices = []
        for (let i = this._userInfos.length - 1; i >= 0; i--) {
            if (this._userInfos[i].offline) {
                const userId = this._userInfos[i].userId
                notices.push({
                    username: this._userInfos[i].username,
                    channelId: this._userInfos[i].channelId
                })
                //this._userInfos.splice(i, 1)
                // unlockTask.push(this.unlockCoin(userId, i))
            }
        }
        if (unlockTask.length > 0) {
            await Promise.all(unlockTask)
        }
        this.noticeOffline(notices)
        await Promise.all(saveTask)

        // this._statusJob = scheduleJob({
        //     start: Date.now() + 6000
        // }, () => {
        //     this.onStart()
        // })
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

    private async saveUserData_racing(): Promise<number[]> {
        // 保存所有下过注的玩家金额
        let saveCoin = []
        this._betInfos_car.forEach(e => {
            if (saveCoin.includes(e.userId)) {
                //saveCoin中已经存在该玩家
                return
            }
            saveCoin.push(e.userId)
        })
        let task = []
        saveCoin.forEach(e => {
            const userInfo = this._userInfos.find(e1 => e1.userId === e)
            if (userInfo) {
                task.push(this._userService.updateUserCoin(e, userInfo.coin).catch(err => {
                    logger.warn(err)
                    if (!userInfo.offline) {
                        this.akickByUserId(userInfo.userId, 'kick by coin update fail')
                    }
                }))
            }
        })
        if (task.length > 0) {
            await Promise.all(task)
        }
        return saveCoin
    }

    // 用户下注记录入库
    private async saveBetRecord_racing() {
        if (this._robotBetInfos_car.length === 0 && this._betInfos_car.length === 0) {
            return
        }

        return await this._recordService.saveBetRecord_racing(this._betInfos_car, this._userInfos, this.dingdanID, this._robotBetInfos_car, this.channelId)
    }
    // 游戏记录入库
    private async saveGameRecord_racing(endType: number, operatorId: number, roundReward: number) {
        return this._recordService.saveGameRecord_racing(roundReward, this.dingdanID, this._winNum, endType, operatorId, this.channelId, this._rebate)
    }

    //
    private async saveProgress(progress: number) {
        if (await this._controlConfig.finished(this.channelId)) {
            return true
        }
        return await this._controlConfig.saveProgress(progress, this.channelId)
    }
    // 计算当前局输赢
    private async getRoundReward() {
        let progress = 0
        this._betInfos_car.forEach(e => {
            e.data.forEach(w => {
                if (w.index == this._winNum) {
                    e.payOut = w.betCount * 5.9;
                    progress -= w.betCount * 5.9;
                } else {
                    progress += w.betCount;
                }
            })
        })
        // this._betInfos.forEach(e => {
        //     e.cashOut ? progress -= (e.betCount * e.multiple / 100 - e.betCount) : progress += e.betCount
        // })
        return progress
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
        if (this._updating.includes(userId)) {
            return false
        }
        const userInfo = this._userInfos.find(e => e.userId === userId)
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
        this.sendToUser(userId, 'syncProp_racing', { coin: userInfo.coin })
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
            const index = this._updating.indexOf(userId)
            this._updating.splice(index, 1)
        }
        userInfo.coin -= coin
        if (coin === 0) {
            userInfo.coin = 0
        }
        this.sendToUser(userId, 'syncProp_racing', { coin: userInfo.coin })
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
