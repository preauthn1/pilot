import { Application, getLogger, scheduleJob } from "pinus";
import pirate, { Pirate } from ".";
import { bet_danQianBao, settle_danQianBao, resolveBetGameCode } from "../../util/HttpsUtil";
import { randomNum, weightedRandomSelection } from "../../util/random";
import { delayTime, generateUniqueUuid } from "../../util/time";
import Line from "./Line";
import { PirateGameBase } from "./pirateGameBase";
import { getUserRebate } from "../../util/Util";
const logger = getLogger("pirate")

export class Jack extends PirateGameBase {

    kick: boolean;

    constructor(app: Application, uesrId: number, v: Pirate, username: string, channelId: number | string, walletType: number, merchantId: string, gameCode?: string) {

        super(app, uesrId, v, username, channelId, walletType, merchantId, gameCode);

        this._control = {
            win_threshold: 0, lose_threshold: 0, win_threshold_percentage: 0, lose_threshold_percentage: 0
        }
        this.LineBase = this._pirateIndex.line;
    }

    get walletType(): number {
        return this._walletType;
    }

    setControl(v) {
        //console.log('------------setControl:',v);

        this._control.lose_threshold = v.lose_threshold;
        this._control.win_threshold = v.win_threshold;

        this._control.lose_threshold_percentage = this.coin * v.lose_threshold_percentage / 100;
        this._control.win_threshold_percentage = this.coin * v.win_threshold_percentage / 100;
    }

    // private _gameConfig: PirateConfig;
    // public get gameConfig(): PirateConfig {
    //     return this._gameConfig;
    // }
    // public set gameConfig(v: PirateConfig) {
    //     this._gameConfig = v;
    // }

    stop() {
        this._runing = false;
        if (!this.refObj.isSettle)
            settle_danQianBao(this._username, this.channelId, this.refObj.id, 0, this.url, this.merchantId, resolveBetGameCode(this.refObj.gameCode, this.gameCode));
        this.betCount = 0;
        this.betCut = 0;
        this._pirateIndex.deleteUserInfoById(this.userId);
        this.kick = true;
    }

    private nums = [
        1,  //骷髅
        2,  //A
        3,  //卷轴
        4,  //船锚
        5,  //箱子
        6,  //钩子
        7,  //金币
        8,  //K
        9,
        10,
        11,
        12
    ];
    private weight = [
        50,     //骷髅
        100,    //A
        100,    //卷轴
        100,    //船锚
        100,    //箱子
        100,    //钩子
        100,    //金币
        100,    //K
        350,    //9
        350,    //10
        350,    //J
        350     //Q
    ];
    private LineBase: Line;

    private randArr = [168, 160, 150, 140, 130, 120, 110, 105, 100, 100];
    async buildLine(): Promise<{ lines: number[][]; aliveLine: any[]; mult: number; }> {
        let list = [];
        let rabate: number = await this._pirateIndex.getRabate(this.channelId);
        console.log("渠道:", this.channelId, "   杀率:", rabate);
        if (rabate < 0 || rabate > 9) {
            rabate = 0;
        }
        for (let i = 0; i < 15; i++) {
            if (i == 0 || i == 5 || i == 10) {
                this.weight[0] = 0;
            } else {
                this.weight[0] = this.randArr[rabate];
            }
            list.push(weightedRandomSelection(this.nums, this.weight));
        }
        return this.LineBase.testMult(list);
    }

    private _conditions;
    private _runing: boolean;

    async run(count: number, amount: number, channelId, auto: boolean, tag: string, level: number = 1) {
        let cccount = count;

        this.betCount = count;
        this.betCut = 0;
        this._conditions = true;
        this._runing = true;
        let winCount: number = 0;
        let startCoin: number = this.coin;
        //console.log('开始执行下注:', startCoin);
        //console.log('this._control.lose_threshold_percentage:',this._control.lose_threshold_percentage);
        this.betAndSettle_jack(channelId, amount, auto, tag);


        // while (this._conditions && this._runing) {
        //     //    console.log('下注前:',this.coin);
        //     if (this.coin < amount) {
        //         this._conditions = false;
        //         break;
        //     }

        //     let betResult = await this.betAndSettle_jack(channelId, amount, auto, tag);
        //     this.betCut++;
        //     if (betResult.goOn) {
        //         if (this.betCount > 0) {
        //             cccount--;
        //             this._conditions = cccount > 0;
        //         } else if (this.betCount == -1) {
        //             this._conditions = true;
        //         }
        //         // startCoin += betResult.result;
        //         winCount = this.coin - startCoin;
        //         //console.log('本轮结果:',betResult.result);

        //         // console.log('下注后:',this.coin,'       结算结果:',winCount);

        //         if (winCount > 0) {
        //             if (this._control.win_threshold != 0 && winCount >= this._control.win_threshold) {
        //                 this._conditions = false;
        //             }
        //             if (this._control.win_threshold_percentage != 0 && winCount >= this._control.win_threshold_percentage) {
        //                 //console.log('触发自动结算     absWin:',winCount,'       this._control.lose_threshold:',this._control.win_threshold_percentage);
        //                 this._conditions = false;
        //             }
        //         } else {
        //             let absWin = Math.abs(winCount);
        //             if (this._control.lose_threshold != 0 && absWin >= this._control.lose_threshold) {
        //                 this._conditions = false;
        //             }
        //             if (this._control.lose_threshold_percentage != 0 && absWin >= this._control.lose_threshold_percentage) {
        //                 //console.log('触发自动结算     absWin:',absWin,'       this._control.lose_threshold:',this._control.lose_threshold_percentage);
        //                 this._conditions = false;
        //             }
        //         }
        //         //如果没有赢的线路，延迟2秒，如果有，每有一条，延迟增加1.5秒
        //         // await this.delayTime();
        //         let dtime = betResult.isBig > 0 ? 1700 * betResult.time + 4000 + 2000 : 1500 * betResult.time + 2000;
        //         console.log("线路:", betResult.time, "     延迟:", dtime, "    大赢家:", betResult.isBig);

        //         await delayTime(dtime);
        //     } else {
        //         this._conditions = false;
        //     }
        // }
        this.betCount = 0;
        this.betCut = 0;
        // this._runing = false;
        // this._pirateIndex.deleteBetInfoById(this.userId);
        // this._pirateIndex.sendToUser(this.userId, "betEnd", { msg: "" });
    }

    private refObj: { id: string | number, isSettle: boolean, gameCode?: string };
    async betAndSettle_jack(channelId: number, amount: number, auto: boolean, tag: string): Promise<{ goOn: boolean; result: number; time: number, isBig: number }> {

        let date = new Date;
        let refId = generateUniqueUuid();//parseInt(date.getTime() + "" + this.userId);
        const betGameCode = this.gameCode
        this.refObj = {
            id: refId,
            isSettle: false,
            gameCode: betGameCode
        }
        let data = {
            goOn: true,
            result: 0,
            time: 0,
            isBig: 0
        }
        let before_coin = this.coin;

        let betJson = await bet_danQianBao(this._username, channelId, amount, refId, this.url, this.merchantId, betGameCode);
        if (!betJson || betJson.code != 0) {
            data.goOn = false;
            return data;
        }
        this.coin = betJson.data.balance;
        const user = this._pirateIndex.getUser(this.userId);
        // this.coin -= amount;

        let betObj = {
            auto: this.betCount != 1,
            allCount: this.betCount,
            cut: this.betCut,
            coin: this.coin,
            amount: amount,
            lines: null
        }

        // let firstBase = 10;
        let win = false;
        if (user.firstPlay) {
            //新用户
            win = randomNum(1, 1000) < 600 ? true : false;

        } else {
            win = randomNum(1, 1000) < 400 ? true : false;
        }


        let flag = true;
        let obj: any;
        let pay = 0;
        let result = 0;
        //console.log("     willWin:", willWin);
        //洗牌出牌
        while (flag) {
            obj = await this.buildLine();
            if (!obj) {
                flag = true;
                continue;
            }

            const mult = await this._pirateIndex.getMaxPayOut(this.channelId)
            if (obj.mult > mult / 100) {
                flag = true;
                continue;
            }

            //新玩家
            const midllemult = user.firstPlay ? 1 : 0;

            flag = (win && obj.mult <= midllemult) || (!win && obj.mult > midllemult);
        }
        // if (user.firstPlay) {
        //     console.log("-------------------------");
        //     console.log("**************obj.mult:", obj.mult, "       win:", win);
        // }

        betObj.lines = obj.lines;
        this._pirateIndex.sendToUser(this.userId, "betPirate", betObj);
        result = 0;
        pay = 0;
        for (let i = 0; i < obj.aliveLine.length; i++) {
            const element = obj.aliveLine[i];
            result += element.pay;
            element.pay = element.pay * amount;
            pay += element.pay;
        }


        // if (!this._runing) {
        //     data.goOn = false;
        //     return data;
        // }
        user.payCount += pay - amount;

        /* --------------------------------结算开始--------------------------------- */

        settle_danQianBao(this._username, channelId, refId, pay, this.url, this.merchantId, betGameCode);
        this.refObj.isSettle = true;
        //线数据  
        /* ---------------------------------结算结束--------------------------------- */

        

        this.coin += pay;
        obj.coin = this.coin;
        obj.auto = this.betCount != 1;
        obj.allCount = this.betCount;
        obj.cut = this.betCut;
        obj.amount = amount;
        obj.pay = pay;
        obj.isBig = 0;

        if (result >= this.gameConfig.superWinMult) {
            obj.isBig = 2;
        } else if (result >= this.gameConfig.bigWinMult) {
            obj.isBig = 1;
        }
        const nomTime = obj.aliveLine.length > 0 ? 1500 : 1000 
        const dtime = obj.isBig > 0 ? 2000 * obj.aliveLine.length + 4000 + nomTime: 2000 * obj.aliveLine.length + nomTime;
        //obj.time = dtime;
        let finTime = new Date;
        // if (pay > 0) {
        //     await delayTime(500)
        // }
        this._pirateIndex.sendToUser(this.userId, "betAndSettle", obj);
        const betInfo = {
            userId: this.userId,
            username: this._username,
            round_id: refId,//这特么是订单编号，他命名index
            betCount: amount,
            auto: auto,
            multiple: result / 10,
            payout: pay,
            betTime: date,
            finishTime: finTime,
            beforCoin: before_coin,
            afterCoin: before_coin + pay,
            expand: 1,
            CoinTag: tag,
            gameTag: 4,
            betNo_str: null,     //'betNo_str,'  赛车相关
            betCount_str: null,   //' betCount_str,' 赛车相关
            win_car_num: null       //'win_car_num,' 赛车相关
        }
        user.firstWinMax -= pay - betInfo.betCount;
        if (user.firstWinMax <= 100) {
            user.firstPlay = false;
        }
        //游戏记录入库
        this._pirateIndex.saveGameRecord_pirate(amount - pay, refId, result / 10, this.channelId).catch(err => { logger.warn(err) });
        //玩家下注-成绩记录
        this._pirateIndex.saveBetRecord_pirate(betInfo, this.userId).catch(err => logger.warn(err));
        //水池
        const progress = pay - amount;//progress > 0,代表当前局玩家赢
        this._pirateIndex.saveProgress(progress, this.channelId).catch(err => logger.warn(err));

        data.goOn = true;
        data.result = pay > 0 ? pay : amount * -1;
        data.time = obj.aliveLine.length;
        data.isBig = obj.isBig;
        //console.log("               result:",data);
        this._pirateIndex.sendToUser(this.userId, "pirate_roundEnd", { isAuto: auto,time:dtime });
        this._runing = false;
        this._pirateIndex.betInfoPayOut(this.userId);
        return data;
    }


    betAndSettle(channelId: string | number, amount: number, auto: boolean, tag: string): void {
        return;
    }

    turbo(): boolean {
        return true;
    }

}


