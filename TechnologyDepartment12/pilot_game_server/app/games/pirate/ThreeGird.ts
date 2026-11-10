import { Application, getLogger, scheduleJob } from "pinus";
import pirate, { Pirate } from ".";
import { ControlService } from "../../services/controlService";
import { bet_danQianBao, cancel_danQianBao, settle_danQianBao, resolveBetGameCode } from "../../util/HttpsUtil";
import { generateBoolean, randomNum, weightedRandomSelection } from "../../util/random";
import { delayTime, generateUniqueUuid } from "../../util/time";
import Line from "./Line";
import pirateControlConfig, { PirateControlConfig } from "./pirateControlConfig";
import { PirateGameBase } from "./pirateGameBase";
const logger = getLogger("pirate")
// export default function (app: Application, userId: number, v: Pirate, username) {
//     if (jack === null) {
//         jack = new Jack(app, userId, v, username);
//     }
//     return jack
// }

export class threeGird extends PirateGameBase {

    // userId: number;
    // betCount: number;
    // betCut: number;
    //

    kick: boolean = false;

    private cardConfig: any;
    private cardArr: number[];
    private mults: number[];
    private weights: number[];
    private randArr: number[];

    //big mege supermega间隔时间
    private superWinDeyTime: number = 3000;
    //每一局默认消耗的时间
    private roundTime: number;

    // private _pirate: Pirate;
    // private _rabate: number;
    // private _username;
    // private _control: { win_threshold: number, lose_threshold: number, win_threshold_percentage: number, lose_threshold_percentage: number }
    // private _controlService: ControlService;

    constructor(app: Application, uesrId: number, v: Pirate, username: string, channelId: number | string, walletType: number, merchantId: string, gameCode?: string) {
        //  this._pirateIndex = v;
        // this.merchantId = merchantId;
        // this._username = username;
        // this.userId = uesrId;
        // this._walletType = walletType;
        // this._controlService = app.get('controlService')
        // this.channelId = channelId;
        // this._gameControlConfig = pirateControlConfig(app);
        super(app, uesrId, v, username, channelId, walletType, merchantId, gameCode);
        /*  */
        this.cardConfig = this.gameControlConfig.threeGirdData;
        this.cardArr = [];
        this.mults = [];
        for (let i = 1; i <= 7; i++) {
            this.cardArr.push(i);
            this.mults.push(this.cardConfig["card_" + i]);
        }
        this.weights = this.gameControlConfig.getThreeGirdWeight(this.channelId);
        this.weights = [
            200,//3
            200,//5
            150,//8
            100,//10
            80,//25
            80,//100
            50 //250
        ]
        this.randArr = [250, 245, 240, 235, 230, 225, 220, 215, 210, 205];
        this.isFast = false;
        this.roundTimes = [1000, 2400];
        this.roundTime = this.roundTimes[1];
        /*  */
        this.url = this._pirateIndex.getSeting().url;// 'http://18.143.42.211';
        this._control = {
            win_threshold: 0, lose_threshold: 0, win_threshold_percentage: 0, lose_threshold_percentage: 0
        }

    }


    stop(): void {
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

    // private _gameControlConfig: PirateControlConfig;
    // public get gameControlConfig(): PirateControlConfig {
    //     return this._gameControlConfig;
    // }
    // public set gameControlConfig(v: PirateControlConfig) {
    //     this._gameControlConfig = v;
    // }

    getReferByShapan(coin: number): number {

        /* 
            余额100内爆奖50-300倍中奖率80%开始递减
            余额1000以内爆奖30-200倍 50%开始递减
            余额5000以内爆奖5-100倍30%开始递减
        */

        let referNum = 22;
        if (coin > 0 && coin < 10000) {
            referNum = 80 - (coin / 10000) * 30;
        } else if (coin >= 10000 && coin < 100000) {
            referNum = 50 - (coin / 100000) * 20;
        } else if (coin >= 100000 && coin < 500000) {
            referNum = 30 - (coin / 500000) * 22;
        }

        return referNum;
    }

    getReferByFirstPlayer(amount: number, max: number): number {

        let maxMult = Math.floor(max / (amount / 5)) + 5;
        let left = 1;
        let right = 1;
        let referNum = 0;
        if (maxMult < 0)
            maxMult = 0;

        if (maxMult <= 5) {
            left = 0;
            right = 5;
        } else {
            left = 5;
            right = maxMult;
            if (right - left <= 5) {
                referNum = 20;
            } else {
                referNum = 75;
            }
        }
        return referNum;
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
            this._pirateIndex.sendToUser(this.userId, "tg_betError", { msg: "" });
            return;
        }
        this.coin = betJson.data.balance;
        //this.coin -= amount;
        //杀率
        let win = false;
        let user = this._pirateIndex.getUserInfo(this.userId);
        //  let sub = 0
        let mult = 0;
        let roundData;
        // if (user.firstPlay) {
        //     //还能赢的钱
        //   //  sub = user.firstWinMax - user.payCount;
        //     console.log("user.firstWinMax:", user.firstWinMax);

        //     console.log("新玩家,payCount:", user.payCount, "        还能赢多少:", sub);
        // }

        let winLevel: number = 1;
        let multBase: number = 1;
        let mapData: number[][] = [[], [], []];
        let linesInfo = [];
        let tenMult:boolean = false;
        roundData = this.runOne();
        roundData.lines.forEach(line => {
            mult += this.mults[line.lineHead - 1]
        })
        let pay: number;
        let endDelayTime = this.roundTime;
        //摇10倍大奖
        let tryTofortune = randomNum(1, 1000) <= 300;//300;//240;

        if (tryTofortune) {
            let fortuneSuccess: boolean = randomNum(1, 100) <= 3;  
            if (user.firstPlay || mult > 0)
                fortuneSuccess = false;
            if(user.winPlayer){
                fortuneSuccess = generateBoolean(this.getReferByShapan(before_coin) / 100);
            }
            this._pirateIndex.sendToUser(this.userId, "tg_tryTofortune", { time: endDelayTime });
            await delayTime(1000);

            if (fortuneSuccess) {
                //随机10倍
                //log("￥￥￥￥￥￥￥￥￥Super￥￥￥￥￥￥￥￥￥￥")
                //尝试翻10倍成功
                const superNums = [1, 2, 3, 4, 5, 6];
                const superNumsWeight = [100, 80, 5, 0, 0, 0];
                const superNum = weightedRandomSelection(superNums, superNumsWeight);
                const superCards: number[][] = [[], [], []];
                for (let i = 0; i < 3; i++) {
                    let superCards_heng = superCards[i];
                    superCards_heng.push(superNum)
                    superCards_heng.push(superNum)
                    superCards_heng.push(superNum)
                }
                mult = 0;
                roundData = this.runOne(superCards);
                roundData.lines.forEach(line => {
                    mult += this.mults[line.lineHead - 1]
                })
                mult = mult * 10;
                multBase = 10;
                // pay = amount / 5 * mult;
                this._pirateIndex.sendToUser(this.userId, "tg_fortuneGame", { success: true, superNum: superNum, time: 4000 });
                await delayTime(4000);
                //先剔除掉幸运符号外的牌
                let queKou: number[][] = [];
                for (let j = 0; j < 3; j++) {
                    for (let K = 0; K < 3; K++) {
                        queKou.push([j, K])
                    }
                }

                while (queKou.length > 0) {
                    const len = randomNum(1, queKou.length);
                    let cardReplace: { ops: number[], num: number }[] = [];
                    for (let i = 0; i < len; i++) {
                        const index = randomNum(0, queKou.length - 1);
                        const ops = queKou[index];
                        const num = superNum;//randomNum(1, 10) < 3 ? 7 : superNum
                        let obj = {
                            ops: ops,//[2,1]
                            num: num
                        }
                        cardReplace.push(obj);
                        queKou.splice(index, 1);
                        mapData[ops[0]][ops[1]] = num;
                    }
                    this._pirateIndex.sendToUser(this.userId, "tg_cardReplace", { cardReplace: cardReplace });
                    await delayTime(1500);
                }
                this._pirateIndex.sendToUser(this.userId, "tg_cardReplace_end", { time: 1500 });

                //log("superNum:",superNum);

            } else {
                //尝试翻10倍失败，正常结算，MULT = 0
                this._pirateIndex.sendToUser(this.userId, "tg_fortuneGame", { success: false, superNum: -1 });
                //endDelayTime = 0;
                mapData = roundData.cards;
            }

        } else {
            //不尝试翻10倍，正常结算，MULT = 0
            if (user.firstPlay || user.winPlayer) {
                console.log("----特殊玩家:", user.firstPlay ? "firstPlay" : "winPlayer");
                let referNum = 0;
                let maxMult = 0;//Math.floor(max / (amount / 5)) + 5;
                if (user.firstPlay) {

                    referNum = this.getReferByFirstPlayer(amount, user.firstWinMax)
                    maxMult = Math.floor(user.firstWinMax / (amount / 5)) + 5;
                } else {
                    referNum = this.getReferByShapan(before_coin);
                }

                //输赢概率
                //是否超过最大倍数   
                let r = randomNum(0, 100);
                let fwin = r < referNum;
                const tj = maxMult == 0 ?
                    (fwin && mult <= 5) || (!fwin && mult > 5) :
                    (fwin && mult <= 5) || (!fwin && mult > 5) || mult > maxMult
                while (tj) {
                    roundData = this.runOne();
                    mult = 0;
                    roundData.lines.forEach(line => {
                        mult += this.mults[line.lineHead - 1];
                    })
                    // r = randomNum(0, 100);
                    // fwin = r < referNum;
                }
                //console.log("新玩家,实际游戏倍数:",mult);
                pay = amount / 5 * mult;
            } else {
                //console.log("------走正常杀率---不翻10倍也不是新玩家-------");

                let rabate = await this._pirateIndex.getRabate(this.channelId);
                if (isNaN(rabate) || (rabate < 0 || rabate > 9)) {
                    rabate = 6;
                }
                // const randArr = [150, 145, 140, 135, 130, 125, 115, 110, 105, 100];  //95% ~ 80%

                const num = this.randArr[rabate];
                win = randomNum(1, 1000) < num ? true : false;
                //const win = randomNum(1, 1001) < 100 ? true : false;

                console.log("  杀率:", rabate, "    randArr[rabate]:", num, "    win:", win);

                while (mult > 260 || ((win && mult <= 0) || (!win && mult > 0))) {
                    mult = 0;
                    roundData = this.runOne();
                    roundData.lines.forEach(line => {
                        mult += this.mults[line.lineHead - 1]
                    })
                }

                let dl_1: boolean;
                let dl_2: boolean;
                let dl_3: boolean;
                roundData.lines.forEach(line => {
                    if (line.index == 1) {
                        dl_1 = true;
                    }
                    if (line.index == 2) {
                        dl_2 = true;
                    }
                    if (line.index == 3) {
                        dl_3 = true;
                    }
                })
                if (dl_1 && dl_2 && dl_3) {
                    mult = mult * 10;
                    tenMult = true;
                }
                //console.log("最终倍数:", mult);

            }


            mapData = roundData.cards;
        }
        pay = amount / 5 * mult;

        // 
        /* --------------------------------结算开始--------------------------------- */

        if (pay > 0) {
            const srttleJson = await settle_danQianBao(this._username, channelId, refId, pay, this.url, this.merchantId, betGameCode);
            if (srttleJson && srttleJson.code == 0) {
                this.refObj.isSettle = true;
            }
        } else {
            settle_danQianBao(this._username, channelId, refId, pay, this.url, this.merchantId, betGameCode);
            this.refObj.isSettle = true;
        }

        if (!this.refObj.isSettle) {
            //结算未成功
            this._pirateIndex.sendToUser(this.userId, "tg_betError", { card: roundData.cards });
            cancel_danQianBao(this._username, channelId, refId, amount, this.url, this.merchantId, betGameCode);
            return;
        }
        //let oldcards = JSON.parse(JSON.stringify(roundData.cards));
        //装饰卡片信息
        this._pirateIndex.sendToUser(this.userId, "tg_cards", { card: roundData.cards });
        await delayTime(endDelayTime * 0.15);  //卡牌滚动的预留时间
        //console.log("卡牌滚动时间:", endDelayTime * 0.15);

        // console.log("this.coin:", this.coin, "    payOut:", pay);
        this._pirateIndex.sendToUser(this.userId, "tg_shuffleCompleted", { tiger: roundData.hasBaida });
        let roundDelTime: number = 0;
        if (roundData.hasBaida) {
            roundDelTime = 1000;//有百搭符号，所以给了一秒展示百搭的时间，不用再多给
        } else {
            if (mult > 0) {
                roundDelTime += this.isFast ? 500 : 1000;
            } else {
                roundDelTime += this.isFast ? 0 : 300;
            }
            // roundDelTime = this.isFast ? 0 : 300;
        }


        await delayTime(roundDelTime);

        if (mult > 0) {
            pay = amount / 5 * mult;
            const bili = pay / amount;
            //线条  倍数  盈利

            roundData.lines.forEach(li => {
                const lineMult = this.mults[li.lineHead - 1]
                linesInfo.push({ lineHead: li.lineHead, index: li.index, payOut: amount / 5 * lineMult * multBase })
            })


            this._pirateIndex.sendToUser(this.userId, "tg_roundData", { line: linesInfo });
            await delayTime(800);  //展示线条结果的预留时间
            if (tenMult) {
                this._pirateIndex.sendToUser(this.userId, "tg_tenMult", {});
                await delayTime(2000);  //触发普通10倍的展示时间
            }
            let bigWinShowCount: number = 0;
            if (bili >= 10) {
                //bigWin
                //赔付大于总下注10倍
                winLevel = 2;
                if (bili >= 35) {
                    bigWinShowCount = amount * 35;
                } else {
                    bigWinShowCount = amount * bili;
                }
                this._pirateIndex.sendToUser(this.userId, "tg_bigWin", { time: this.superWinDeyTime, pay: bigWinShowCount });
                await delayTime(this.superWinDeyTime);
            }
            if (bili >= 36) {
                //megaWin
                //赔付大于总下注35倍
                winLevel = 2;
                if (bili >= 50) {
                    bigWinShowCount = amount * 50;
                } else {
                    bigWinShowCount = amount * bili;
                }
                this._pirateIndex.sendToUser(this.userId, "tg_megaWin", { time: this.superWinDeyTime, pay: bigWinShowCount });
                await delayTime(this.superWinDeyTime);
            }
            if (bili >= 51) {
                //superMegaWin
                //赔付大于总下注50倍
                winLevel = 3;
                bigWinShowCount = amount * bili;
                this._pirateIndex.sendToUser(this.userId, "tg_superMegaWin", { time: this.superWinDeyTime, pay: bigWinShowCount });
                await delayTime(this.superWinDeyTime);
            }
        } else {
            pay = 0;
        }

        let finTime = new Date;

        //结算完成，准备入库
        this.coin += pay;
        user.payCount += pay - amount;
        let result = 0;
        const betInfo = {
            userId: this.userId,
            username: this._username,
            round_id: refId,//这特么是订单编号，他命名index
            betCount: amount,
            auto: auto,
            multiple: mult,
            payout: pay,
            betTime: date,
            finishTime: finTime,
            beforCoin: before_coin,
            afterCoin: this.coin,
            expand: 1,
            CoinTag: tag,
            gameTag: 4,
            betNo_str: JSON.stringify(mapData),     //棋盘数据
            betCount_str: JSON.stringify(linesInfo),   //中奖线路
            win_car_num: betLevel       //'win_car_num,' 赛车相关
        }
        user.firstWinMax -= betInfo.payout - betInfo.betCount;
        user.winMax -= betInfo.payout - betInfo.betCount;
        //游戏记录入库
        this._pirateIndex.saveGameRecord_pirate(amount - pay, refId, result / 10, this.channelId).catch(err => { logger.warn(err) });
        //玩家下注-成绩记录
        this._pirateIndex.saveBetRecord_pirate(betInfo, this.userId).catch(err => logger.warn(err));
        //水池
        const progress = pay - amount;//progress > 0,代表当前局玩家赢
        //  console.log("pay:", pay, "   progress:", progress);

        this._pirateIndex.saveProgress(progress, this.channelId).catch(err => logger.warn(err));
        this._pirateIndex.updateMoneyData(this.userId, user.winMax);

        //console.log("               result:",data);
        //await delayTime(500);
        const betRndObj = { auto: auto, mult: mult, pay: pay, level: winLevel, coin: this.coin }
        // console.log("betRndObj:", betRndObj);

        this._pirateIndex.sendToUser(this.userId, "tg_roundEnd", betRndObj);
        this._pirateIndex.betInfoPayOut(this.userId);
        if (this.kick) {
            this._pirateIndex.deleteUserInfoById(this.userId);
        }
    }

    private winMax() {

    }

    private runOne(cardArr: number[][] = null): { lines: { lineHead: number, index: number }[], cards: number[][], oneCount: number, hasBaida: boolean } {
        let cardsData = null;
        let cards = null
        if (cardArr) {
            cardsData = {
                cards: cards,
                hasBaiDa: cardArr[0][0] == 7,
                oneCount: 0 //这个值只有开奖才有意义，因为这里必开奖，所以设置为0也无所谓
            };
            cards = cardArr;
        } else {
            cardsData = this.createCards();
            cards = cardsData.cards;
        }

        let obj: {
            cards: number[][],
            lines: { lineHead: number, index: number }[],
            oneCount: number,
            hasBaida: boolean
        }
            = { lines: [], cards: cards, oneCount: cardsData.oneCount, hasBaida: cardsData.hasBaiDa }

        let calcuData = null;
        calcuData = this.calculateWinningCards(cards)
        obj.lines = calcuData.line;
        if (cardsData.hasBaiDa) {

            for (let i = 1; i <= 6; i++) {
                const cardsStr = JSON.stringify(cards);
                const cardCopy = JSON.parse(cardsStr);
                for (let j = 0; j < cardCopy.length; j++) {
                    const cardRow = cardCopy[j];
                    for (let K = 0; K < cardRow.length; K++) {
                        let cardNum = cardRow[K];
                        if (cardNum == 7) {
                            cardCopy[j][K] = i;
                        }
                    }
                }

                calcuData = this.calculateWinningCards(cardCopy);
                calcuData.line.forEach(c => {
                    if (!obj.lines.find(e => e.index == c.index)) {
                        obj.lines.push(c);
                    }
                })
            }
        }

        return obj;
    }


    checkRow(row: number[]): number {
        const target = row[0];
        for (let i = 1; i < row.length; i++) {
            if (row[i] !== target) {
                return NaN;
            }
        }
        return target;
    }

    calculateWinningCards(cards: number[][]) {
        const rows = cards.length;
        const cols = cards[0].length;
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
            let heng = this.checkRow(cards[i])
            if (!isNaN(heng)) {
                WinningInfo.mult += this.mults[heng - 1];
                WinningInfo.line.push({ lineHead: heng, index: heads[i] });
            }
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

    createCards(row: number = 3): { cards: number[][], hasBaiDa: boolean, oneCount: number } {
        let cards: number[][] = [];
        let baida: boolean = false;
        let oneCount: number = 0;
        for (let i = 0; i < row; i++) {
            cards[i] = [];
            for (let j = 0; j < row; j++) {
                const num = weightedRandomSelection(this.cardArr, this.weights);
                cards[i].push(num);
                if (num == 1)
                    oneCount++
                if (num == 7)
                    baida = true;
            }
        }
        const obj = {
            cards: cards,
            hasBaiDa: baida,
            oneCount: oneCount
        }
        return obj;
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


