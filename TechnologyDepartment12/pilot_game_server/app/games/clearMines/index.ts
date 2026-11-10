import { Application, BackendSession, Channel, getLogger } from "pinus"
import { WALLET_TYPE } from "../../consts/code";
import { ControlService } from "../../services/controlService";
import { RecordService } from "../../services/recordService";
import { UserService } from "../../services/userService";
import { bet_danQianBao, cancel_danQianBao, getBalanceNew, settle_danQianBao, resolveBetGameCode } from "../../util/HttpsUtil";
import clearMinesConfig, { ClearMinesConfig } from "./ClearMinesConfig";
import clearMines_ControlConfig, { ClearMinesControlConfig } from "./ClearMinesControlConfig";
import { randomNum } from "../../util/random";
import { delayTime, generateUniqueUuid } from "../../util/time";
const logger = getLogger("ClearMines")
let clearMines: ClearMines = null

// 统一创建对象接口
export default function (app: Application) {
    if (clearMines === null) {
        clearMines = new ClearMines(app)
    }
    return clearMines
}

export class ClearMines {
    private _channel: Channel;
    private _running: boolean;
    private _gameConfig: ClearMinesConfig;
    private _loading: number[];
    private _unloading: number[];
    private _updating: number[];
    private _userService: UserService
    private _recordService: RecordService
    private _controlService: ControlService;
    private _setting: { notice: boolean, url: string };
    private _controlConfig: ClearMinesControlConfig;
    private _app: Application;
    private _map: number[];
    private _userInfos: {
        merchantId: string, userId: number, username: string,
        coin: number, offline: boolean, channelId: number, gameCode: string,
        expand: string, tag: string, walletType: number, firstPlay: boolean, firstWinMax: number
    }[];
    private _betInfos: {
        [key: string | number]: {
            userId: number, round_id: number, betCount: number, mults: number[],
            multiple: number, auto: boolean, cashOut: boolean, gameTag: number,
            betTime: Date, finishTime: Date, beforCoin: number, afterCoin: number,
            currency?: string, minesCount: number, clickArr: number[], payout: number, CoinTag: string,
            downTime: any, gameCode?: string
        }[]
    };
    constructor(private app: Application) {
        this._app = app;
        this._controlConfig = clearMines_ControlConfig(app)
        this._gameConfig = clearMinesConfig(app);
        this._channel = app.channelService.getChannel("game_member_clearMines", true)
        this._setting = app.get('setting');
        this._userService = app.get('userService')
        this._recordService = app.get('recordService')
        this._controlService = app.get('controlService')

        this._userInfos = []
        this._loading = []
        this._updating = []
        this._betInfos = {}
        this._unloading = []
        this._map = [];
        for (let i = 0; i < 25; i++) {
            this._map.push(i);
        }
    }

    public run() {
        console.log("------新扫雷启动------");

        if (this._running) {
            return
        }
        // this._running = true
        // //this.onStart()
        // this._controlConfig = clearMines_ControlConfig(this._app)
        // this._gameConfig = clearMinesConfig(this._app);
        // this._channel = this._app.channelService.getChannel("game_member_clearMines", true)
        // this._setting = this._app.get('setting');
        // this._userService = this._app.get('userService')
        // this._recordService = this._app.get('recordService')
        // this._controlService = this._app.get('controlService')

        // this._userInfos = []
        // this._loading = []
        // this._updating = []
        // this._betInfos = {}
        // this._unloading = []

        // for (let i = 0; i < 25; i++) {
        //     this._map.push(i);
        // }
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
        userInfo.offline = false
        this._channel.add(userId.toString(), connectors[0].id)
    }

    public async getBalance(userId: number, channelId: any): Promise<number> {
        let user = this._userInfos.find(u => u.userId == userId);
        console.log("单钱包返回的数据:", user);
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
    public async enter(userId: number, tag: string, channelId: any, gameCode: string): Promise<boolean> {
        const connectors = this.app.getServersByType('connector');
        // const connectors = this.app.getServersByType('connector')
        try {
            if (!this._loading)
                this._loading = []
            this._loading.push(userId)
            const userModal = await this._userService.loadUserInfo(userId, channelId);


            let coin: number;
            let balanceJson = await getBalanceNew(userModal.username, channelId, this._setting.url, userModal.merchantId, gameCode);
            // let balanceJson = JSON.parse(balanceStr);
            if (!balanceJson || balanceJson.code != 0) {
                coin = 0;
            } else {
                coin = parseFloat(balanceJson.data.balance);
            }

            console.log("玩家ID:", userId, "     金币:", coin);
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
                merchantId: userModal.merchantId,
                tag: tag,
                firstPlay: firstPlay,
                firstWinMax: firstWinMax,
                walletType: 0
            }

            this.delUserInfoById(userId);
            this._userInfos.push(userInfo)

            if (this._channel.getMember(userInfo.userId.toString())) {
                this._channel.removeMember(userInfo.userId.toString());
            }
            this._channel.add(userInfo.userId.toString(), connectors[0].id);
            //console.log('       mines玩家登录:', userInfo, "  msg.channelId:", channelId)
        } catch (error) {
            logger.error('get userinfo error:', error)
            return false
        } finally {
            const index = this._loading.findIndex(e => e === userId)
            this._loading.splice(index, 1)
        }
        return true

    }

    private delUserInfoById(userId: number) {
        const index = this._userInfos.findIndex(u => u.userId == userId);
        this._userInfos.splice(index, 1);
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


        return con.gamemax / 100;
    }

    async getRabate(channelId): Promise<number> {
        let con = await this._controlConfig.getControlById(channelId);
        //   console.log("------------海盗多渠道测试:公式乘数--------------");
        //   console.log("渠道:", channelId, "    公式乘数:", con.rebate);
        return con.rebate;
    }

    public async bet(userId: number, betCount: number, mines: number, isauto: boolean) {
        //随机订单
        let refId = generateUniqueUuid();//date2Number(new Date()).toString()

        const userInfo = this.getUserInfo(userId)
        if (!userInfo)
            return false;
        const betGameCode = userInfo.gameCode

        let betObj = await bet_danQianBao(userInfo.username, userInfo.channelId, betCount, refId, this._setting.url, userInfo.merchantId, betGameCode);
        console.log("新扫雷----单钱包下注结果:", betObj);
        if (!betObj || betObj.code != 0) {
            return false;
        }
        userInfo.coin = betObj.data.balance;
        let betData = {
            userId: userInfo.userId,
            round_id: refId,
            betCount: betCount,
            mults: this._gameConfig.getMultsByMinesCount(mines),
            multiple: 0,
            auto: isauto,
            cashOut: false,
            gameTag: 2,
            betTime: new Date(),
            finishTime: null,
            beforCoin: userInfo.coin,
            afterCoin: 0,
            currency: userInfo.tag,
            minesCount: mines,
            clickArr: [],
            payout: 0,
            CoinTag: userInfo.tag,
            downTime: 0,
            gameCode: betGameCode
        }
        if (!this._betInfos[userInfo.channelId])
            this._betInfos[userInfo.channelId] = [];
        this._betInfos[userInfo.channelId].push(betData)
        return true

    }

    /** 位置校验  返回是钻石还是地雷 */
    public async clickMinesHandler(pos: number, userId: number, channelId: string | number): Promise<{ success: boolean, length: number }> {
        let userInfo = this.getUserInfo(userId)
        if (!userInfo) {
            return { success: false, length: 0 }
        }
        let betInfo = this._betInfos[userInfo.channelId].find(e => e.userId == userId);
        if (!betInfo) {
            return { success: false, length: 0 }
        }
        betInfo.clickArr.push(pos);
        let mult = await this.judgmentResult(userId, betInfo.betCount, channelId)
        betInfo.payout = mult * betInfo.betCount;


        // betInfo.clickArr.push(pos);

        let length: number = 0;
        //如果是地雷  自动结算
        if (mult <= 0) {
            // betInfo.multiple = 0
            let cash = await this.cashOutMines(userId, false);
            if (!cash) {
                logger.error("扫雷结算错误,id:", userId);
            }

            console.log("-----新扫雷stepOnMinesAndCashOut");
            this.sendToUser(userId, "stepOnMinesAndCashOut", cash).catch((e) => {
                console.log("-----新扫雷stepOnMinesAndCashOut,error", e);
            })
            length = -1;
        } else {
            length = betInfo.clickArr.length;
        }

        // if (isWin) {
        //     //如果钻石被点完了 结算
        //     //this.cashOutMines(userId)
        // }
        return { success: true, length: length }
    }

    async autoBetHandler(userId: number, clkArr: number[]) {
        const userInfo = this.getUserInfo(userId);
        let betInfo = this._betInfos[userInfo.channelId].find(e => e.userId == userId);
        betInfo.clickArr = clkArr;
        console.log("betInfo:", betInfo);
        const mult = await this.judgmentResult(userId, betInfo.betCount, userInfo.channelId);
        betInfo.payout = mult * betInfo.betCount;
        return await this.cashOutMines(userId, true);
    }

    /**
   * 验证玩家点击
   */
    private async judgmentResult(userId: number, amount: number, channelId): Promise<number> {

        const userInfo = this.getUserInfo(userId)
        let betInfo = this._betInfos[userInfo.channelId].find(e => e.userId == userId);
        let nowMult = betInfo.mults[betInfo.clickArr.length - 1];
        const maxPayOut = await this.getMaxPayOut(channelId);
        console.log("minese maxPayOut:", maxPayOut);

        if (nowMult > maxPayOut) {
            return 0;
        }

        let rebate: number = 0;
        if (userInfo.firstPlay) {
            const maxMult = Math.floor(userInfo.firstWinMax / amount) + 1;
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
            console.log("minese  新玩家");
            console.log(left + "<      >" + right, "        概率:", referNum);
            rebate = fwin ? -1 : 1;
            betInfo.multiple = fwin ? nowMult : 0;
            console.log("实际倍数:", betInfo.multiple);
        } else {
            const control = await this._controlConfig.getControlById(channelId);
            rebate = control.rebate;
            const mu = 100 - rebate * 8;
            const gailv = mu / nowMult;


            const num = randomNum(1, 1000);
            const isWin = num < gailv * 10 ? true : false;

            betInfo.multiple = isWin ? nowMult : 0;
            console.log("clearMines--杀率:", rebate, "    实际胜率:", gailv + "%");
            console.log("最终胜负:", isWin, "      最终结果:", nowMult);

        }

        return betInfo.multiple;
    }

    public async cashOutMines(userId: number, isAuto: boolean): Promise<{ clickPos: number[]; minesPos: number[]; mult: number; payOut: number; coin: number; isBigWin: boolean; }> {
        let userInfo = this.getUserInfo(userId)
      //  console.log("cashOutMines:userInfo", userInfo, userId);
        if (!userInfo) {
            return null;
        }

        let betInfo = this._betInfos[userInfo.channelId].find(e => e.userId == userId);
        // console.log("cashOutMines:betInfo", betInfo);
        if (!betInfo || betInfo.cashOut) {
            return null;
        }

        if (betInfo.clickArr.length < 1) {
            //未点击棋盘，订单取消
            await this.cannelBet(userId);
        } else {
            await settle_danQianBao(userInfo.username, userInfo.channelId, betInfo.round_id.toString(), betInfo.payout, this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode))
            userInfo.coin += betInfo.payout;
            betInfo.cashOut = true;
            betInfo.finishTime = new Date();
            this.saveUserDataMines(userId);
        }

        const minesPos = this.getMapResult(betInfo, isAuto);
        if (minesPos.length > betInfo.minesCount) {// 9  4
            minesPos.splice(betInfo.minesCount, minesPos.length - betInfo.minesCount)
        }
        return {
            clickPos: betInfo.clickArr,
            minesPos: minesPos,
            mult: betInfo.multiple,
            payOut: betInfo.payout,
            coin: userInfo.coin,
            isBigWin: betInfo.multiple >= 10
        }
    }

    private getMapResult(betInfo: any, isAuto: boolean) {
        // const length = betInfo.minesCount;
        // let minesPosArr: number[] = [];
        // while (minesPosArr.length < length) {
        //     let pos = randomNum(0, 24);
        //     while (betInfo.clickArr.indexOf(pos) > -1 || minesPosArr.indexOf(pos) > -1) {
        //         pos = randomNum(0, 24)
        //     }
        //     minesPosArr.push(pos);
        // }
        // return minesPosArr

        if (!betInfo)
            return null
        let minesPosArr: number[];
        let mabeMinesPos: number[] = null;
        mabeMinesPos = this._map.filter(function (v) { return betInfo.clickArr!.indexOf(v) == -1 })//数组差集
        if (betInfo.multiple <= 0) {
            minesPosArr = [];
            if (isAuto) {
                let checked: number[] = betInfo.clickArr.slice();
                const mcount = randomNum(1, checked.length);
                for (let i = 0; i < mcount; i++) {
                    const index = randomNum(0, checked.length - 1);
                    minesPosArr.push(checked[index]);
                    checked.splice(index, 1)
                }

            } else {
                //点到雷了,clickArr数组最后一个元素是雷
                minesPosArr.push(betInfo.clickArr[betInfo.clickArr.length - 1]);
            }
        }

        return this.getMinesPosArr(mabeMinesPos, betInfo.minesCount, minesPosArr);
    }

    private getMinesPosArr(mabeMinesPos: number[], minesCount: number, arr: number[] = null): number[] {
        let tarr = arr ? arr : [];
        if (arr)
            minesCount -= arr.length;
        for (let i = 0; i < minesCount; i++) {
            const index = randomNum(0, mabeMinesPos.length - 1);
            tarr.push(mabeMinesPos[index]);
            mabeMinesPos.splice(index, 1);
        }

        //打乱顺序
        for (let i = 0; i < tarr.length; i++) {
            const randomIndex = Math.round(Math.random() * (tarr.length - 1 - i)) + i;
            [tarr[i], tarr[randomIndex]] = [tarr[randomIndex], tarr[i]]
        }

        return tarr
    }

    async cannelBet(userId: number) {
        let userInfo = this.getUserInfo(userId)
        if (!userInfo) {
            return null;
        }

        let betInfo = this._betInfos[userInfo.channelId].find(e => e.userId == userId);
        //console.log("cashOutMines:betInfo", betInfo);
        if (!betInfo || betInfo.cashOut) {
            return null;
        }
        //通知订单取消
        const betCount = betInfo.betCount
        let obj = await cancel_danQianBao(userInfo.username, userInfo.channelId.toString(), betInfo.round_id.toString(), betCount.toString(), this._setting.url, userInfo.merchantId, resolveBetGameCode(betInfo.gameCode, userInfo.gameCode))

        if (!obj || obj.code != 0) {
            return;
        }

        userInfo.coin += betCount
        this.spliceBetInfoByUserID(userId);

    }

    // 游戏记录入库
    /**
     * @parma settlement 坐庄输赢
     * @parma roundId 订单号
     * @parma result 游戏结果
     */
    async saveGameRecord_mines(settlement: number, roundId: number, result: number, channelId: any, rebate: number = 0) {
        this._recordService.saveGameRecord(settlement, roundId, result, 0, 0, channelId, rebate);
    }


    private async saveUserDataMines(userId: number) {
        //修改金额
        const userInfo = this.getUserInfo(userId)
        let betInfo = this._betInfos[userInfo.channelId].find(e => e.userId == userId);
        if (userInfo.firstPlay) {
            userInfo.firstWinMax -= betInfo.payout - betInfo.betCount;
        }
        try {
            // 用户下注记录入库   游戏记录入库
            //console.log("用户下注记录入库   游戏记录入库");

            this._recordService.saveUserData(betInfo, userInfo);
            this.saveGameRecord(0, 0, betInfo.payout, betInfo.round_id, betInfo.multiple, userInfo.channelId);
            //this._recordService.saveBetRecordMines(this._betInfos, this._userInfos, userId, this._MinesMapDatas, this._MinesNowMapDatas)
        } catch (error) {
            logger.error('mines saveBet error:', error)
        } finally {
            let reward = betInfo.betCount * betInfo.multiple;
            //根據輸贏，增減獎池
            this._controlConfig.saveProgress(reward - betInfo.betCount, userInfo.channelId);
            this.spliceBetInfoByUserID(userId);
        }
    }

    // 游戏记录入库
    private async saveGameRecord(endType: number, operatorId: number, roundReward: number, roundId: any, result: number, channelID: any, rebate: number = 0) {
        return this._recordService.saveGameRecord(roundReward, roundId, result, endType, operatorId, channelID, rebate)
    }

    public spliceBetInfoByUserID(userId: number) {
        console.log("--------删除玩家订单--------");

        let userInfo = this.getUserInfo(userId);
        this._betInfos[userInfo.channelId] = null;
        // let uindex = this._betInfos[userInfo.channelId].findIndex(e => e.userId == userId)
        // this._betInfos[userInfo.channelId].splice(uindex, 1)
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



    public getContext(userId: number) {
        // 根据状态同步不一样的数据
        const userInfo = this._userInfos.find(e => e.userId === userId);
        return userInfo;
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
    public getbetInfo(userId: number) {
        const userInfo = this.getUserInfo(userId)
        if (this._betInfos[userInfo.channelId]) {
            return this._betInfos[userInfo.channelId].findIndex(e => e.userId === userId)
        } else {
            this._betInfos[userInfo.channelId] = [];
            return -1;
        }
    }

    public async offline(userId: number) {

        const index = this._userInfos.findIndex(e => e.userId === userId)
        if (index < 0)
            return;
        const userInfo = this._userInfos[index];
        await this.cashOutMines(userId, false);//结算

        console.log("clearMines用户离线 ---", userId);
        // if (userInfo.walletType == WALLET_TYPE.ZHUAN) {
        //     this.saveUserCoin(userId);
        //     this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }]);
        //     this._userService.notice([{ username: userInfo.username, channelId: userInfo.channelId }]);
        //     this.unlockCoin(userId);
        // }

        this._userService.noticeOffline([{ username: userInfo.username, channelId: userInfo.channelId }]);
        this._userService.notice([{ username: userInfo.username, channelId: userInfo.channelId }]);
        this.unlockCoin(userId);
        //清空注单
        //this.spliceBetInfoByUserID(userId)
        //清空用户列表
        this._userInfos.splice(index, 1)
        this._channel.removeMember(userId.toString())

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
            userInfo = null;
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

        return true
    }

    /** 开关快速模式 */
    turbo(userId: number) {

    }


}
