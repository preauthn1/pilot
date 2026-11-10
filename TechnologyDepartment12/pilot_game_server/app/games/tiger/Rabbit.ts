import { Application, getLogger, scheduleJob } from "pinus";
import tiger, { Tiger } from ".";
import { ControlService } from "../../services/controlService";
import { bet_danQianBao, cancel_danQianBao, settle_danQianBao, resolveBetGameCode } from "../../util/HttpsUtil";
import { generateBoolean, randomNum, weightedRandomSelection } from "../../util/random";
import { delayTime, generateUniqueUuid } from "../../util/time";
import tigerControlConfig, { TigerControlConfig } from "./tigerControlConfig";
import { TigerGameBase } from "./tigerGameBase";
const logger = getLogger("tiger")
// export default function (app: Application, userId: number, v: Tiger, username) {
//     if (jack === null) {
//         jack = new Jack(app, userId, v, username);
//     }
//     return jack
// }

export class Rabbit_Kill extends TigerGameBase {

    // userId: number;
    // betCount: number;
    // betCut: number;
    //

    kick: boolean = false;
    public _tigerIndex: Tiger;

    private randArr: number[];

    //big mege supermega间隔时间
    private superWinDeyTime: number = 3000;
    //每一局默认消耗的时间
    private roundTime: number;

    private profitCoin: number;
    private profitCoinStatic: number;


    private lines: number[][] = [[0, 0, 0], [0, 1, 0], [0, 1, 1], [1, 1, 0], [1, 1, 1], [1, 2, 1], [1, 2, 2], [2, 2, 1], [2, 2, 2], [2, 3, 2]]
    private cardList_1: string[];
    private cardList_2: string[];
    private cardList_3: string[];
    private nums: string[] = ["gold_", "1", "2", "3", "4", "5", "6", "7"];
    private weis: number[] = [
        100,
        100,
        100,
        100,
        100,
        80,
        60,
        60
    ];
    private mults: number[] = [2, 3, 5, 10, 50, 100, 200];
    private hasGold: boolean = false;
    // private roundResult: { hightLines: any[], goldArr: any[],mult:number,goldMult:number };
    private roundResult: { hightLines: { hightLines: any[], mults: number[] }, goldArr: { goldArr: any[], mults: number[] }, mult: number, goldMult: number };
    private ooobj: { hightLines: { hightLines: any[], mults: number[] }, goldArr: { goldArr: any[], mults: number[] }, mult: number, goldMult: number }
    constructor(app: Application, uesrId: number, v: Tiger, username: string, channelId: number | string, walletType: number, merchantId: string, coin: number, gameCode?: string) {

        super(app, uesrId, v, username, channelId, walletType, merchantId, gameCode);
        /*  */

        this.mults = [2, 3, 5, 10, 50, 100, 200];
        // for (let i = 1; i <= 7; i++) {
        //     this.cardArr.push(i);
        //     this.mults.push(this.cardConfig["card_" + i]);  
        // }
        //this.weights = this.gameControlConfig.getThreeGirdWeight(this.channelId);

        this.randArr = [300, 295, 290, 285, 280, 275, 270, 265, 260, 255];
        this.isFast = false;
        this.roundTimes = [1000, 2400];
        this.roundTime = this.roundTimes[1];
        /*  */
        this.url = this._tigerIndex.getSeting().url;// 'http://18.143.42.211';
        this._control = {
            win_threshold: 0, lose_threshold: 0, win_threshold_percentage: 0, lose_threshold_percentage: 0
        }

        this.coin = coin;
        this.profitCoinStatic = this.coin > 500000 ? this.coin * 1.2 : 500000;
        this.profitCoin = this.profitCoinStatic;
        console.log("--  this.profitCoin:", this.coin, this.profitCoin);

    }


    stop(): void {
        this._tigerIndex.deleteUserInfoById(this.userId);
        this.kick = true;
    }

    get walletType(): number {
        return this._walletType;
    }

    /**
     * 自动下注用来控制输赢的参数
     */
    setControl(v) {
        //console.log('------------setControl:',v);
    }

    private createGoldNum(): number {
        if (randomNum(1, 1000) > 333) {
            return 0
        }
        const rebate = 4;
        const rand = Math.floor(Math.random() * (0xffffffff + 1))
        const num = Math.floor(Math.max(1, (2 ** 32 / (rand + 1)) * (1 - rebate / 100)) * 80)
        const gmult = Math.floor(num / 100);
        return gmult == 0 ? 0.5 : gmult;
    }

    private refObj: { id: string | number, isSettle: boolean, gameCode?: string };

    async betAndSettle(channelId: string | number, amount: number, auto: boolean, tag: string, betLevel: number) {

        let date = new Date;
        let refId = generateUniqueUuid();//parseInt(date.getTime() + "" + this.userId);
        const betGameCode = this.gameCode
        this.refObj = {
            id: refId,
            isSettle: false,
            gameCode: betGameCode
        }
        let before_coin = this.coin;
        let betJson = await bet_danQianBao(this._username, channelId, amount, refId, this.url, this.merchantId, betGameCode);
        if (!betJson || betJson.code != 0) {
            console.log("兔子游戏下注出错");
            this._tigerIndex.sendToUser(this.userId, "rb_betError", { msg: "" });
            return;
        }
        this.coin = betJson.data.balance;
        let user = this._tigerIndex.getUserInfo(this.userId);
        let pay: number;
        let endDelayTime = this.roundTime;

        // ---------------------------开始------------------------------
        let multCount: number = 0;
        let rabate = await this._tigerIndex.getRabate(this.channelId);
        if (isNaN(rabate) || (rabate < 0 || rabate > 9)) {
            rabate = 6;
        }

        //清空牌
        this.cardList_1 = []
        this.cardList_2 = []
        this.cardList_3 = []

        const num = this.randArr[rabate];
        const win = randomNum(1, 1000) < num ? true : false;
        let mult: number;
        this.roundResult = null;
        const trySuper: boolean = generateBoolean(0.2);
        if (trySuper) {
            //10轮金卡大奖
            const superWin: boolean = generateBoolean(this.getReferByShapan(before_coin) / 100 * 0.9);
            this._tigerIndex.sendToUser(this.userId, "rb_tryTofortune", { time: endDelayTime });
            await delayTime(3500);
            if (superWin) {
                //通知用户

                this._tigerIndex.sendToUser(this.userId, "rb_fortuneGame", { success: true, superNum: 0, time: 4000 });
                await delayTime(4000);
                //清空数据，换成金卡
                mult = 0;
                let allGoldMult = 0;
                for (let i = 0; i < 8; i++) {
                    this.cardList_1 = []
                    this.cardList_2 = []
                    this.cardList_3 = []
                    let nowCount = 0;
                    let nowMult = 0;
                    let reTime = 0;
                    this._tigerIndex.sendToUser(this.userId, "rb_rockGoldCard", { time: endDelayTime });
                    await delayTime(2000)
                    //如何做到，在判断出所得倍数即将超过最大倍数的时候，清空数据并重发牌
                    for (let t = 0; t < 4; t++) {
                        if (t < 3) {
                            let num1 = this.createGoldNum();
                            if (allGoldMult + num1 > 40 && nowCount >= 4)
                                num1 = 0;
                            if (num1 > 0) {
                                nowCount++;
                                nowMult += num1;
                            }
                            this.cardList_1.push(num1 > 0 ? this.nums[0] + num1 * amount / 100 : "null")
                            let num2 = this.createGoldNum();
                            if (allGoldMult + num2 > 40 && nowCount >= 4)
                                num2 = 0;
                            if (num2 > 0) {
                                nowCount++;
                                nowMult += num2;
                            }
                            this.cardList_3.push(num2 > 0 ? this.nums[0] + num2 * amount / 100 : "null")
                        }
                        let num3 = this.createGoldNum();
                        if (allGoldMult + num3 > 40 && nowCount >= 4)
                            num3 = 0;
                        if (num3 > 0) {
                            nowCount++;
                            nowMult += num3;
                        }
                        this.cardList_2.push(num3 > 0 ? this.nums[0] + num3 * amount / 100 : "null")
                    }

                    if (nowCount >= 5) {
                        allGoldMult += nowMult;
                        //  log("当前中奖:",allGoldMult) 
                        // 翻出5张金卡，这里要做出延迟播放翻牌动画
                        reTime = 1500;
                    }
                    this._tigerIndex.sendToUser(this.userId, "rb_cardReplace", { card: [this.cardList_1, this.cardList_2, this.cardList_3], pay: allGoldMult });
                    await delayTime(500);
                    if (reTime > 0) {
                        this._tigerIndex.sendToUser(this.userId, "rb_goldRoundInfo", { thisRoundMult: nowMult, pay: allGoldMult * amount });
                        await delayTime(reTime);
                    }
                }

                mult = allGoldMult > 40 ? 40 : allGoldMult;
                multCount += mult;
                this._tigerIndex.sendToUser(this.userId, "rb_cardReplaceEnd", [this.cardList_1, this.cardList_2, this.cardList_3]);
            } else {
                //应该先洗牌，洗到mult = 0
                this.getRoundMult(false);
                this._tigerIndex.sendToUser(this.userId, "rb_fortuneGame", { success: false, superNum: -1 });
            }

        } else {
            //1：线条倍数总和不能打过260  
            //2：金卡倍数不能超过26  
            //3：

            let referNum = this.getReferByShapan(before_coin);
            console.log("rabbit------正常游戏,概率:", referNum);
            //输赢概率
            //是否超过最大倍数   
            let fwin = generateBoolean(referNum / 100);
            let roundResult: { mult: number, totalGold: number } = this.getRoundMult(fwin);
            let outPay: boolean = roundResult.mult + roundResult.totalGold > 5;
            while ((fwin && !outPay) || (!fwin && outPay)) {
                multCount = 0;
                roundResult = this.getRoundMult(fwin);
                outPay = roundResult.mult + roundResult.totalGold > 5;
                // r = randomNum(0, 100);
                // fwin = r < referNum;
            }
            //console.log("rabbit_kill roundResult:",roundResult);

            //---------

            multCount += roundResult.mult;
            multCount += roundResult.totalGold;
        }

        pay = amount * multCount;
        //先结算
        /* --------------------------------结算开始--------------------------------- */
        if (pay > 0) {
            const uuser = this._tigerIndex.getUserInfo(this.userId);
            if (!uuser) {
                cancel_danQianBao(this._username, channelId, refId, pay, this.url, this.merchantId, betGameCode);
                return
            }
            const srttleJson = await settle_danQianBao(this._username, channelId, refId, pay, this.url, this.merchantId, betGameCode);
            if (srttleJson && srttleJson.code == 0) {
                this.refObj.isSettle = true;
            }
        } else {
            settle_danQianBao(this._username, channelId, refId, pay, this.url, this.merchantId, betGameCode);
            this.refObj.isSettle = true;
        }

        //推送牌的数据
        this._tigerIndex.sendToUser(this.userId, "rb_cards", { card: [this.cardList_1, this.cardList_2, this.cardList_3] });
        await delayTime(1000)
        //通知客户端停止滚动
        this._tigerIndex.sendToUser(this.userId, "rb_shuffleCompleted", { playAni: this.hasGold });


        if (this.roundResult) {
            //有金卡要给0.5秒动画时间
            if (this.hasGold) {
                await delayTime(500)
            }

            //通知客户端牌面中奖情况
            if (this.roundResult.hightLines.hightLines.length > 0) {

                this._tigerIndex.sendToUser(this.userId, "rb_hightLines", { lines: this.roundResult.hightLines, pay: this.roundResult.mult * amount / 10 });
                await delayTime(1000)
            }
            if (this.roundResult.goldArr.goldArr.length > 4) {
                this._tigerIndex.sendToUser(this.userId, "rb_goldCards", { goldCards: this.roundResult.goldArr, pay: this.roundResult.goldMult * amount });
                await delayTime(2000)
            }
        }


        let winLevel: number = 1;//大赢家等级   10~15倍   15~35倍  35倍往上
        let bigWinShowCount: number = 0;
        const bili = pay / amount;
        if (bili >= 10) {
            //bigWin
            //赔付大于总下注10倍
            winLevel = 2;
            if (bili >= 15) {
                bigWinShowCount = amount * 15;
            } else {
                bigWinShowCount = amount * bili;
            }
            this._tigerIndex.sendToUser(this.userId, "rb_bigWin", { time: this.superWinDeyTime, pay: bigWinShowCount });
            await delayTime(this.superWinDeyTime);
        }
        if (bili > 15) {
            //megaWin
            //赔付大于总下注35倍
            winLevel = 2;
            if (bili >= 35) {
                bigWinShowCount = amount * 35;
            } else {
                bigWinShowCount = amount * bili;
            }
            this._tigerIndex.sendToUser(this.userId, "rb_megaWin", { time: this.superWinDeyTime, pay: bigWinShowCount });
            await delayTime(this.superWinDeyTime);
        }
        if (bili > 35) {
            //superMegaWin
            //赔付大于总下注50倍
            winLevel = 3;
            bigWinShowCount = amount * bili;
            this._tigerIndex.sendToUser(this.userId, "rb_superMegaWin", { time: this.superWinDeyTime, pay: bigWinShowCount });
            await delayTime(this.superWinDeyTime);
        }

        this.coin += pay;
        const betRndObj = { auto: auto, mult: multCount, pay: pay, level: winLevel, coin: this.coin }
        this._tigerIndex.sendToUser(this.userId, "rb_roundEnd", betRndObj);

        //----------------------------结束--------------------------------

        let finTime = new Date;
        const mapData = [this.cardList_1, this.cardList_2, this.cardList_3];

        //结算完成，准备入库



        if (this.coin > this.profitCoinStatic) {
            this.profitCoin = 200000;
        }
        if (this.coin < 200000) {
            this.profitCoin = this.profitCoinStatic;
        }

        user.payCount += pay - amount;
        //let result = 0;
        const betInfo = {
            userId: this.userId,
            username: this._username,
            round_id: refId,//这特么是订单编号，他命名index
            betCount: amount,
            auto: auto,
            multiple: multCount,
            payout: pay,
            betTime: date,
            finishTime: finTime,
            beforCoin: before_coin,
            afterCoin: this.coin,
            expand: 1,
            CoinTag: tag,
            gameTag: 4,
            betNo_str: JSON.stringify(mapData),     //棋盘数据
            betCount_str: JSON.stringify(this.roundResult ? this.roundResult.hightLines.hightLines : []),   //中奖线路
            win_car_num: betLevel       //'win_car_num,' 赛车相关
        }
        user.firstWinMax -= betInfo.payout - betInfo.betCount;
        //游戏记录入库
        this._tigerIndex.saveGameRecord_tiger(amount - pay, refId, multCount, this.channelId).catch(err => { logger.warn(err) });
        //玩家下注-成绩记录
        this._tigerIndex.saveBetRecord_tiger(betInfo, this.userId).catch(err => logger.warn(err));
        //水池
        const progress = pay - amount;

        this._tigerIndex.saveProgress(progress, this.channelId).catch(err => logger.warn(err));

        this._tigerIndex.betInfoPayOut(this.userId);
        if (this.kick) {
            this._tigerIndex.deleteUserInfoById(this.userId);
        }
    }


    getReferByShapan(coin: number): number {

        /* 
            余额100内爆奖50-300倍中奖率80%开始递减
            余额1000以内爆奖30-200倍 50%开始递减
            余额5000以内爆奖5-100倍30%开始递减
        */
        console.log("coin:", coin, this.profitCoin);

        let referNum = 9;
        if (coin > 0 && coin < 10000) {
            console.log("-----------第一档");
            referNum = 80 - (coin / 10000) * 30;
        } else if (coin >= 10000 && coin < 100000) {
            console.log("-----------第二档");
            referNum = 50 - (coin / 100000) * 20;
        } else if (coin >= 100000 && coin < this.profitCoin) {
            console.log("-----------第三档");
            referNum = 30 - (coin / this.profitCoin) * 22;
        }

        return referNum;
    }

    /**
     * 根据输赢生成棋牌数据
     */
    getRoundMult(win: boolean): { mult: number, totalGold: number } {
        let flag = true;
        let mult: number;
        let totalGold: number
        while (flag) {
            flag = false;
            const result = this.runOne();
            mult = result.mult;
            totalGold = result.totalGold;
            if (win) {
                //赢
                if (mult <= 0 && totalGold <= 0) {
                    flag = true;
                } else {
                    if (mult + totalGold > 40) {
                        flag = true;
                    }
                }
            } else {
                //输
                if (mult > 0 || totalGold > 0) {
                    flag = true;
                }
            }
        }
        return { mult: mult, totalGold: totalGold }
    }

    private runOne(): { totalGold: number, mult: number } {
        this.cardList_1 = []
        this.cardList_2 = []
        this.cardList_3 = []
        this.hasGold = false;
        for (let i = 0; i < 4; i++) {
            if (i < 3) {
                this.cardList_1.push(weightedRandomSelection(this.nums, this.weis))
                this.cardList_3.push(weightedRandomSelection(this.nums, this.weis))
            }
            this.cardList_2.push(weightedRandomSelection(this.nums, this.weis))
        }

        const result = this.comparisonLines();
        const goldArr = result.goldArr;
        this.hasGold = goldArr.length > 0;
        let totalGold: number = 0;
        let goldMults: number[] = [];
        if (result.goldArr.length >= 5) {
            for (let x = 0; x < goldArr.length; x++) {
                const element = goldArr[x];
                let str = "";
                switch (element[0]) {
                    case 0:
                        str = this.cardList_1[element[1]].split("_")[1];
                        goldMults.push(parseFloat(str))
                        totalGold += parseFloat(str);
                        break;
                    case 1:
                        str = this.cardList_2[element[1]].split("_")[1];
                        goldMults.push(parseFloat(str))
                        totalGold += parseFloat(str);
                        break;
                    case 2:
                        str = this.cardList_3[element[1]].split("_")[1];
                        goldMults.push(parseFloat(str))
                        totalGold += parseFloat(str);
                        break;
                }
            }
        }

        let mult = 0;
        let mults: number[] = [];
        result.hightLines.forEach(m => {
            mults.push(this.mults[m.head - 1])
            mult += this.mults[m.head - 1];
        })
        this.roundResult = { hightLines: { hightLines: result.hightLines, mults: mults }, goldArr: { goldArr: result.goldArr, mults: goldMults }, mult: mult, goldMult: totalGold }
        // this.roundResult = {hightLines:result.hightLines,goldArr:result.goldArr,mult:mult,goldMult:totalGold}
        return { totalGold: totalGold, mult: mult / 10 };
    }


    private comparisonLines() {

        let result = [];
        let goldTotal: number = 0;
        for (let i = 0; i < this.lines.length; i++) {
            let len = 1;
            const line = this.lines[i];
            const num_1 = parseInt(this.cardList_1[line[0]]);
            const num_2 = parseInt(this.cardList_2[line[1]]);
            const num_3 = parseInt(this.cardList_3[line[2]]);
            if (isNaN(num_1) || isNaN(num_2) || isNaN(num_3)) {
                continue;
            }

            if (num_1 != num_2) {
                len++;
            }

            if (num_1 != num_3) {
                if (num_2 != num_3)
                    len++;
            }

            if (len < 2) {
                result.push(
                    { no: i + 1, head: num_1 }
                )
                continue
            }

            if (len == 2 && (num_1 == 7 || num_2 == 7 || num_3 == 7)) {
                const head = num_1 == 7 ? (num_2 == 7 ? num_3 : num_2) : num_1;
                result.push(
                    { no: i + 1, head: head }
                )
            }
        }

        let goldCount = 0;
        let goldArr = [];
        for (let j = 0; j < 4; j++) {

            if (j < 3) {
                if (isNaN(parseInt(this.cardList_1[j]))) {
                    this.cardList_1[j] += randomNum(0.1, 10).toFixed(2)
                    goldArr.push([0, j]);
                    goldCount++
                }
                if (isNaN(parseInt(this.cardList_3[j]))) {
                    this.cardList_3[j] += randomNum(0.1, 10).toFixed(2)
                    goldArr.push([2, j]);
                    goldCount++
                }
            }

            if (isNaN(parseInt(this.cardList_2[j]))) {
                this.cardList_2[j] += randomNum(0.1, 10).toFixed(2)
                goldArr.push([1, j]);
                goldCount++
            }
        }
        if (goldCount >= 5) {
            goldTotal += 0;
        }
        return {
            hightLines: result,
            goldArr: goldArr
        };
    }

    calculateWinningCards(cards: number[][]) {
        const rows = cards.length;
        let WinningInfo: {
            mult: number,
            line: { lineHead: number, index: number }[]
        } = {
            mult: 0,
            line: []
        }
        const heads = [2, 1, 3];
        // 检查每一行
        for (let i = 0; i < rows; i++) {
            // let heng = this.checkRow(cards[i])
            // if (!isNaN(heng)) {
            //     WinningInfo.mult += this.mults[heng - 1];
            //     WinningInfo.line.push({ lineHead: heng, index: heads[i] });
            // }
        }

        // // 检查每一列
        // for (let j = 0; j < cols; j++) {
        //     if (checkColumn(cards, j)) {
        //         count++;
        //     }
        // }

        // 检查对角线  4号线
        const upToDown = this.checkDiagonal(cards)
        if (!isNaN(upToDown)) {
            WinningInfo.mult += this.mults[upToDown - 1];
            WinningInfo.line.push({ lineHead: upToDown, index: 4 });
        }
        //  5号线
        const downToUp = this.checkDiagonal2(cards)
        if (!isNaN(downToUp)) {
            WinningInfo.mult += this.mults[downToUp - 1];
            WinningInfo.line.push({ lineHead: downToUp, index: 5 });
        }
        //  console.log("WinningInfo.ine:",WinningInfo.line);

        return WinningInfo;
    }

    //检查竖线
    checkColumn(cards: number[][], colIndex: number): number {
        const target = cards[0][colIndex];
        for (let i = 1; i < cards.length; i++) {
            if (cards[i][colIndex] !== target) {
                return NaN;
            }
        }
        return target;
    }

    checkDiagonal2(cards: number[][]): number {
        const target2 = cards[0][cards[0].length - 1];
        let num = NaN;
        // 检查副对角线
        for (let i = 1; i < cards.length; i++) {
            if (cards[i][cards.length - i - 1] !== target2) {
                break;
            }
            if (i === cards.length - 1) {
                num = target2;
                return num;
            }
        }

    }

    checkDiagonal(cards: number[][]): number {
        const target = cards[0][0];
        let num = NaN;
        // 检查主对角线
        for (let i = 1; i < cards.length; i++) {
            if (cards[i][i] !== target) {
                break;
            }
            if (i === cards.length - 1) {
                num = target;
                return num;
            }
        }
        return num;
    }


    run(count: number, amount: number, channelId: any, auto: boolean, tag: string, level: number): void {
        this.betAndSettle(channelId, amount, auto, tag, level);
    }

    turbo(): boolean {
        this.isFast = !this.isFast;
        this.roundTime = this.isFast ? this.roundTimes[0] : this.roundTimes[1];
        return this.isFast;
    }

}


