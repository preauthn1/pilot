import { Application, BackendSession, Channel, getLogger } from "pinus"
import { WALLET_TYPE } from "../../consts/code";
import { ControlService } from "../../services/controlService";
import { RecordService } from "../../services/recordService";
import { UserService } from "../../services/userService";
import { getBalanceNew } from "../../util/HttpsUtil";
import tigerConfig, { TigerConfig } from "./tigerConfig";
import tigerControlConfig, { TigerControlConfig } from "./tigerControlConfig";
import { threeGird } from "./tiger";
import { TigerGameBase } from "./tigerGameBase";
import { randomNum } from "../../util/random";
import { Rabbit_Kill } from "./Rabbit";
const logger = getLogger("Tiger")
let piger: Tiger = null

// 统一创建对象接口
export default function (app: Application) {
    if (piger === null) {
        piger = new Tiger(app)
    }
    return piger
}

export class Tiger {
    private _channel: Channel;
    private _running: boolean;
    private _gameConfig: TigerConfig;
    private _loading: number[];
    private _unloading: number[];
    private _updating: number[];
    private _userService: UserService
    private _recordService: RecordService
    private _controlService: ControlService;
    private _setting: { notice: boolean, url: string };
    private _controlConfig: TigerControlConfig;
    private _app: Application;

    private _userInfos: {
        merchantId: string, userId: number, username: string, coin: number,
        offline: boolean, channelId: number | string, gameCode: string, expand: string, jack: TigerGameBase, walletType: number
        payCount: number, firstPlay: boolean, firstWinMax: number, winMax: number, winPlayer: boolean
    }[];
    private _betInfos: { userId: number, type: string, payOut: boolean }[];
    constructor(private app: Application) {
        this._app = app;
        this._controlConfig = tigerControlConfig(app)
        this._gameConfig = tigerConfig(app);
        this._channel = app.channelService.getChannel("game_member_tiger", true)
        this._setting = app.get('setting');
        this._userService = app.get('userService')
        this._recordService = app.get('recordService')
        this._controlService = app.get('controlService')

        this._userInfos = []
        this._loading = []
        this._updating = []
        this._betInfos = []
        this._unloading = []
    }

    public run() {


        const array: number[] = [1, 3,2];
        const valuesToCheck: number[] = [1,2,3,4,5,6];
        
        const exists: boolean = valuesToCheck.some(value => array.some(item => item === value));
     
        console.log("------沙盘海盗sss1ss22sss启动------",exists);
        console.log(exists); // 输出: true

        if (this._running) {
            return
        }
        this._running = true
        //this.onStart()
        this._controlConfig = tigerControlConfig(this._app)
        this._gameConfig = tigerConfig(this._app);
        this._channel = this._app.channelService.getChannel("game_member_tiger", true)
        this._setting = this._app.get('setting');
        this._userService = this._app.get('userService')
        this._recordService = this._app.get('recordService')
        this._controlService = this._app.get('controlService')

        this._userInfos = []
        this._loading = []
        this._updating = []
        this._betInfos = []
        this._unloading = []
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
    public reconnect(userId: number, gameCode: string) {
        const connectors = this.app.getServersByType('connector')
        const userInfo = this._userInfos.find(e => e.userId === userId)
        userInfo.gameCode = gameCode
        if (userInfo.jack) {
            userInfo.jack.setGameCode(gameCode)
        }
        userInfo.offline = false
        this._channel.add(userId.toString(), connectors[0].id)
    }

    public async getBalance(userId: number, channelId: any): Promise<number> {
        let user = this._userInfos.find(u => u.userId == userId);
        console.log("Tiger单钱包返回的数据:", user);
        let balanceJson = await getBalanceNew(user.username, channelId, this._setting.url, user.merchantId, user.gameCode);
        // let balanceJson = JSON.parse(balanceStr);

        if (!balanceJson || balanceJson.code != 0) {
            user.coin = 0;
            return NaN;
        } else {
            user.coin = parseFloat(balanceJson.data.balance);
            return user.coin;
        }


    }

    // 玩家enter
    public async enter(userId: number, channelId: any, gameCode: string): Promise<{ username: string, coin: number, lastGameData: any }> {

        //const connectors = this.app.getServersByType('connector')
        let returnObj: { username: string, coin: number, lastGameData: any } = null;
        try {
            this._loading.push(userId)
            const userModal = await this._userService.loadUserInfo(userId, channelId)
            if (!this._loading.includes(userId)) {
                //   解锁玩家数据
                //   await this._userService.unlockCoinById(userId)
                return returnObj
            }

            const channelInfo = await this._controlService.getChannelById(channelId);
            const winPlayer = channelInfo.user_win_money > 0;
            console.log("============channelInfo---tiger:", channelInfo.user_win_money);
            let walletType = await this._controlService.getWalletType(channelId);
            console.log("============userModal---tiger:", userModal);

            let coin: number;

            let balanceJson = await getBalanceNew(userModal.username, channelId, this._setting.url, userModal.merchantId, gameCode);
            if (!balanceJson || balanceJson.code != 0) {
                coin = 0;
            } else {
                coin = parseFloat(balanceJson.data.balance);
            }

            /* 测试盘玩家 */
            console.log("是否测试玩家---tiger:", channelInfo.user_win_money);

            if (winPlayer) {
                const date = new Date(userModal.winMoneyDay);
                const today = new Date();
                // console.log("介尼玛：",userModal.winMoneyDay);
                // console.log(today);
                const moneyHasUpdate = date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate();

                //console.log("日期是否相同:", moneyHasUpdate);

                if (!moneyHasUpdate) {
                    //今日余额还没有数据
                    
                    userModal.winMoney = coin * (channelInfo.user_win_money / 100)
                    //console.log("日期不同，今日还没有数据，要新生成额度:",coin * (channelInfo.user_win_money / 100),userModal.winMoney);
                    this._userService.updateMoneyData(userId, userModal.winMoney);
                }
            }

            let firstPlay: boolean;
            let firstWinMax: number = 0;
            if (userModal.proportion == 0 && userModal.limit == 0) {
                firstPlay = false;
            } else {
                firstWinMax = userModal.proportion / 100 * coin > userModal.limit * 100 ? userModal.limit * 100 : userModal.proportion / 100 * coin;
                firstPlay = !userModal.firstPlay;
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
                jack: null,

                auto: true,
                amount: 0,
                count: 0,
                win_threshold: 0,
                lose_threshold: 0,
                win_threshold_percentage: 0,
                lose_threshold_percentage: 0,

                walletType: walletType,
                merchantId: userModal.merchantId,
                // channelPre: userModal.proportion / 100 * coin,
                //selfPre: userModal.limit * 100,
                firstWinMax: firstWinMax,
                firstPlay: false,
                payCount: 0,
                winPlayer: true,
                winMax: userModal.winMoney
            }
            console.log('       ---tiger玩家登录:', userInfo)

            returnObj = {
                username: userInfo.username,
                coin: userInfo.coin,
                lastGameData: userModal.firstPlay
            }
            let i = this._userInfos.findIndex(u => u.userId == userId);
            if (i >= 0) {
                this._userInfos.splice(i, 1);
            }
            this._userInfos.push(userInfo);
            if (!this._channel.getMember(userId.toString())) {
                const connectors = this.app.getServersByType('connector')
                this._channel.add(userId.toString(), connectors[0].id);
            }
        } finally {
            const index = this._loading.findIndex(e => e === userId)
            this._loading.splice(index, 1)
        }

        return returnObj
    }

    updateMoneyData(userId: number, winMoney: number) {
        console.log("----保存winMax数据:", winMoney);
        this._userService.updateMoneyData(userId, winMoney);
    }

    getUser(userId: number) {
        return this._userInfos.find(e => e.userId == userId);
    }

    get running(): boolean {
        return this._running;
    }

    public stop() {
        if (!this._running) {
            return
        }
        // this._running = false
    }

    async getMaxPayOut(channelId): Promise<number> {
        let con = await this._controlConfig.getControlById(channelId);
        if (con.gamemax == 0) {
            con.gamemax = 2000
        }
        //  console.log("------------:最大结算倍数--------------");
        //  console.log("渠道:", channelId, "    最大结算倍数:", con.gamemax);
        return con.gamemax;
    }

    async getRabate(channelId): Promise<number> {
        let con = await this._controlConfig.getControlById(channelId);
        //   console.log("------------海盗多渠道测试:公式乘数--------------");
        //   console.log("渠道:", channelId, "    公式乘数:", con.rebate);
        return con.rebate;
    }

    public async bet(userId: number, msg: {
        data: {
            auto: boolean, amount: number, count: number, win_threshold: number, lose_threshold: number,
            win_threshold_percentage: number, lose_threshold_percentage: number
        }, tag: string, type: string, level: number
    }) {

        // if (!this._running)
        //     return false;

        let user = this._userInfos.find(e => e.userId == userId);
        let control = null;
        let count = 1;
        let betData: {
            auto: boolean, amount: number, count: number, win_threshold: number, lose_threshold: number, win_threshold_percentage: number, lose_threshold_percentage: number
        } = null;
        console.log("海盗type：", msg.type);

        if (user) {
            //console.log('  uuuuuser:',user);
            switch (msg.type) {
                case "tg":
                    //3x3九宫格
                    //console.log("tg_switch");

                    if (!user.jack) {
                        user.jack = new threeGird(this._app, userId, this, user.username, user.channelId, user.walletType, user.merchantId,user.coin, user.gameCode);
                      
                    }
                    betData = msg.data;
                    break;
                case "rb":
                    //兔子
                    if (!user.jack) {
                        user.jack = new Rabbit_Kill(this._app, userId, this, user.username, user.channelId, user.walletType, user.merchantId,user.coin, user.gameCode);
                    }
                    betData = msg.data;
                default:
                    //海盗
                
                    break;
            }

            user.jack.coin = user.coin;
            user.jack.setControl(control);
            user.jack.run(count, betData.amount, user.channelId, betData.auto, msg.tag, msg.level);
            this._betInfos.push({ userId: userId, type: msg.type, payOut: false });
            return true;
        } else {
            return false;
        }
    }

    // 游戏记录入库
    /**
     * @parma settlement 坐庄输赢
     * @parma roundId 订单号
     * @parma result 游戏结果
     */
    async saveGameRecord_tiger(settlement: number, roundId: number, result: number, channelId: any) {
        //this._recordService.saveGameRecord_pirate(settlement, roundId, result, 0, 0)
        this._recordService.saveGameRecord(settlement, roundId, result, 0, 0, channelId);
    }


    private async saveUserData(userId: number) {
        // const userInfo = this._userInfos.find(e1 => e1.userId === userId)
        // this._userService.updateUserCoin(userId, userInfo.coin)
    }

    async saveBetRecord_tiger(arr, userId) {
        let userInfo = this.getUserInfo(userId);
        //记录入库
        this._recordService.saveUserData(arr, userInfo);
        //  this._recordService.saveBetRecord_pirate(arr)
    }

    async finished(channelId): Promise<boolean> {
        return await this._controlConfig.finished(channelId)
    }

    async saveProgress(progress, channelId) {
        if (await this.finished(channelId)) {
            return true
        }
        return await this._controlConfig.saveProgress(progress, channelId)
    }

    updateUserCoin(userId: number, coin: number) {
        let user = this._userInfos.find(e => e.userId == userId);
        if (user)
            user.coin = coin;
    }

    deleteBetInfoById(userId: number) {
        const index = this._betInfos.findIndex(e => e.userId == userId);
        this._betInfos.splice(index, 1);
    }

    betInfoPayOut(userId: number) {
        // const bet = this._betInfos.find(e => e.userId == userId);
        // if (!bet)
        //     return;
        // bet.payOut = true;
        const index = this._betInfos.findIndex(e => e.userId == userId);
        this._betInfos.splice(index, 1);
    }

    saveUserRecord() {

    }

    public getContext(userId: number) {
        // 根据状态同步不一样的数据
        let statusData = null
        const userInfo = this._userInfos.find(e => e.userId === userId);

        let user = { userInfo: userInfo };
        return user;
    }
    public getUserInfo(userId: number) {
        return this._userInfos.find(e => e.userId === userId)
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
    public getBet(userId: number): boolean {
        const bet = this._betInfos.find(e => e.userId === userId);
        if (!bet)
            return true;

        return bet.payOut
    }

    // 退出订单
    public async cancel(userId: number) {
        let user = this._userInfos.find(e => e.userId === userId);
        this.deleteBetInfoById(user.userId);
        if (!user) {
            return true;
        }
        if (!user.jack) {
            return true;
        }
        user.jack.stop();
        return true;
        // let delIndex = this._betInfos_car.findIndex(e => e.userId == userId)
        // if (delIndex < 0) {
        //     return false
        // }
        // const userInfo = this._userInfos.find(e => e.userId === userId)
        // if (!userInfo) {
        //     return false
        // }

        // let resStr = await cancel_danQianBao(userInfo.username, userInfo.channelId, this._roundId + "_" + userInfo.username,this._setting.url);
        // let resData = JSON.parse(resStr);

        // if (resData.code == 0) {
        //     userInfo.coin = resData.data.balance;
        //     //console.log("取消下注反馈-----:",resData,userInfo.coin);
        //     let delObj = this._betInfos_car[delIndex];
        //     //this._betInfos_car.splice(delIndex, 1);
        //    // this.sendToAll('cancel', { userId: userId, data: delObj.data });
        //     return true
        // } else {
        //     return false;
        // }

    }

    public async offline(userId: number) {
        // 加载数据中玩家掉线，直接解锁玩家数据
        const lIndex = this._loading.findIndex(e => e === userId)
        if (lIndex >= 0) {
            //await this.unlockCoin(userId, -1)
            this._loading.splice(lIndex, 1)
            return
        }
        // 先查找玩家
        const index = this._userInfos.findIndex(e => e.userId === userId)


        if (index < 0) {
            //console.log('没有该玩家--------------------海盗');
            return
        }
        // const userInfo = this._userInfos[index]
        const userInfo = this._userInfos[index];
        if (userInfo.jack)
            userInfo.jack.stop();

        // if (userInfo.walletType == WALLET_TYPE.ZHUAN) {
        //     this.saveUserData(userId);
        //     this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }]);
        //     this._userService.notice([{ username: userInfo.username, channelId: userInfo.channelId }]);
        //     this.unlockCoin(userId);
        // }
        this.saveUserData(userId);
        this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }]);
        this._userService.notice([{ username: userInfo.username, channelId: userInfo.channelId }]);
        this.unlockCoin(userId);
        //   this.deleteBetInfoById(userId);
        //    this.deleteUserInfoById(userId);
        //console.log('玩家离线:',userInfo);    

    }

    private async unlockCoin(userId: number) {
        this._unloading.push(userId)
        let falg = this._userService.unlockCoin(userId)

        if (falg) {
            const index = this._unloading.findIndex(e => e === userId)
            this._unloading.splice(index, 1)
        } else {
            logger.warn('unlock fail: ' + userId)
        }

    }

    deleteUserInfoById(userId: number) {
        let index = this._userInfos.findIndex(e => e.userId === userId);
        if (index >= 0) {
            let userInfo = this._userInfos.find(e => e.userId === userId);
            this._userInfos.splice(index, 1);
            this._channel.removeMember(userId.toString());
            userInfo.jack = null;
            userInfo = null;
        }
    };

    // 计算当前局输赢
    private async getRoundReward() {
        let progress = 0
        // this._betInfos_car.forEach(e => {
        //     e.data.forEach(w => {
        //         if (w.index == this._winNum) {
        //             progress -= w.betCount * 6;
        //         } else {
        //             progress += w.betCount;
        //         }
        //     })
        // })
        // this._betInfos.forEach(e => {
        //     e.cashOut ? progress -= (e.betCount * e.multiple / 100 - e.betCount) : progress += e.betCount
        // })
        return progress
    }

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


    public async increaseCoin(userId: number, coin: number): Promise<boolean> {

        if (this._updating.includes(userId)) {
            return false
        }
        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (!userInfo || !userInfo.jack) {
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
        userInfo.jack.coin += coin
        this.sendToUser(userId, 'syncProp_pirate', { coin: userInfo.jack.coin })
        return true  // 成功
    }

    public async decreaseCoin(userId: number, coin: number): Promise<boolean> {
        if (this._updating.includes(userId)) {
            return false
        }
        const userInfo = this._userInfos.find(e => e.userId === userId)
        if (!userInfo || !userInfo.jack) {
            return false;
        }
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

        if (coin === 0) {
            userInfo.jack.coin = 0
        }
        this.sendToUser(userId, 'syncProp_pirate', { coin: userInfo.jack.coin })
        return true
    }

    /** 开关快速模式 */
    turbo(userId: number) {
        let user = this._userInfos.find(e => e.userId == userId);
        let obj = { success: false, isFast: false }
        if (!user.jack) {
            user.jack = new threeGird(this._app, userId, this, user.username, user.channelId, user.walletType, user.merchantId,user.coin, user.gameCode);
        }
        obj.success = true;
        obj.isFast = user.jack.turbo();
        return obj;
    }

    /**
  * 装饰卡片信息
  * （当随机出来的卡片，1卡太多的时候，不影响赔付的情况下做一定的美化）
  */
    public decorationCard(cards: number[][], oneCount: number) {
        let count: number = 0;
        let oneArr: number[] = [];
        let twoArr: number[] = [];
        let threeArr: number[] = [];

        let upDownArr: number[] = [];
        let downUpArr: number[] = [];

        for (let j = 0; j < 3; j++) {
            const card = cards[1][j];
            if (!oneArr.find(c => c == card)) {
                oneArr.push(card)
            }
        }

        for (let j = 0; j < 3; j++) {
            const card = cards[0][j];
            if (!twoArr.find(c => c == card)) {
                twoArr.push(card)
            }
        }

        for (let j = 0; j < 3; j++) {
            const card = cards[2][j];
            if (!threeArr.find(c => c == card)) {
                threeArr.push(card)
            }
        }

        //upDownArr
        for (let i = 0; i < 3; i++) {
            const card = cards[i][i];
            if (!upDownArr.find(c => c == card)) {
                upDownArr.push(card)
            }
        }

        //downUpArr
        for (let i = 0; i < 3; i++) {
            const card = cards[2 - i][i]; // 2 1 0
            if (!downUpArr.find(c => c == card)) {
                downUpArr.push(card);
            }
        }

        const nums = [1, 2, 3, 4, 5, 6];
        for (let i = 0; i < cards.length; i++) {
            const hengList = cards[i];
            for (let j = 0; j < hengList.length; j++) {
                const card = hengList[j];
                if (card == 1) {
                    if (oneCount <= 1) {
                        break;
                    }
                    //判断位置
                    if (i == 0) {
                        switch (j) {
                            case 0:
                                //2-4线
                                let noNums: number[] = [];
                                if (twoArr.length < 3) {
                                    noNums.push(twoArr[0], twoArr[1]);
                                }
                                if (upDownArr.length < 3) {
                                    noNums.push(upDownArr[0], upDownArr[1]);
                                }
                                let ynums = nums.filter(item => !noNums.includes(item));
                                cards[i][j] = ynums[randomNum(0, ynums.length - 1)];
                                break;
                            case 1:
                                //2线
                                let noNums_1: number[] = [];
                                if (twoArr.length < 3) {
                                    noNums_1.push(twoArr[0], twoArr[1]);
                                }
                                let ynums_1 = nums.filter(item => !noNums_1.includes(item));
                                cards[i][j] = ynums_1[randomNum(0, ynums_1.length - 1)];
                                break;
                            case 2:
                                //2-5线
                                let noNums_3: number[] = [];
                                if (twoArr.length < 3) {
                                    noNums_3.push(twoArr[0], twoArr[1]);
                                }
                                if (downUpArr.length < 3) {
                                    noNums_3.push(downUpArr[0], downUpArr[1]);
                                }
                                let ynums_3 = nums.filter(item => !noNums_3.includes(item));
                                cards[i][j] = ynums_3[randomNum(0, ynums_3.length - 1)];
                                break;
                        }
                        oneCount--
                    } else if (i == 1) {
                        switch (j) {
                            case 0:
                                //1线
                                let noNums_1: number[] = [];
                                if (oneArr.length < 3) {
                                    noNums_1.push(oneArr[0], oneArr[1]);
                                }
                                let ynums_1 = nums.filter(item => !noNums_1.includes(item));
                                cards[i][j] = ynums_1[randomNum(0, ynums_1.length - 1)];
                                break;
                            case 1:
                                //1-4-5线
                                let noNums_3: number[] = [];
                                if (oneArr.length < 3) {
                                    noNums_3.push(oneArr[0], oneArr[1]);
                                }
                                if (downUpArr.length < 3) {
                                    noNums_3.push(downUpArr[0], downUpArr[1]);
                                }
                                if (upDownArr.length < 3) {
                                    noNums_3.push(upDownArr[0], upDownArr[1]);
                                }
                                let ynums_3 = nums.filter(item => !noNums_3.includes(item));
                                cards[i][j] = ynums_3[randomNum(0, ynums_3.length - 1)];
                                break;
                            case 2:
                                //1线
                                let noNums_2: number[] = [];
                                if (oneArr.length < 3) {
                                    noNums_2.push(oneArr[0], oneArr[1]);
                                }
                                let ynums_2 = nums.filter(item => !noNums_2.includes(item));
                                cards[i][j] = ynums_2[randomNum(0, ynums_2.length - 1)];
                                break;
                        }
                        oneCount--
                    } else if (i == 2) {
                        switch (j) {
                            case 0:
                                //3-5线
                                let noNums_3: number[] = [];
                                if (threeArr.length < 3) {
                                    noNums_3.push(threeArr[0], threeArr[1]);
                                }
                                if (downUpArr.length < 3) {
                                    noNums_3.push(downUpArr[0], downUpArr[1]);
                                }

                                let ynums_3 = nums.filter(item => !noNums_3.includes(item));
                                cards[i][j] = ynums_3[randomNum(0, ynums_3.length - 1)];
                                break;
                            case 1:
                                //3线
                                let noNums_1: number[] = [];
                                if (threeArr.length < 3) {
                                    noNums_1.push(threeArr[0], threeArr[1]);
                                }
                                let ynums_1 = nums.filter(item => !noNums_1.includes(item));
                                cards[i][j] = ynums_1[randomNum(0, ynums_1.length - 1)];
                                break;
                            case 2:
                                //3-4线
                                let noNums_4: number[] = [];
                                if (threeArr.length < 3) {
                                    noNums_4.push(threeArr[0], threeArr[1]);
                                }
                                if (upDownArr.length < 3) {
                                    noNums_4.push(upDownArr[0], upDownArr[1]);
                                }

                                let ynums_4 = nums.filter(item => !noNums_4.includes(item));
                                cards[i][j] = ynums_4[randomNum(0, ynums_4.length - 1)];
                                break;
                        }
                        oneCount--
                    }
                }
            }
        }

        return cards;
    }



}
