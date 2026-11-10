import { Application } from "pinus";
import superAce, {SuperAce } from ".";
import { randomNum } from "../../util/random";
import Decimal from 'decimal.js';
import { delayTime } from "../../util/time";

export default class AceInfo {

    /* 
        1：线路长度 X 倍数 （base）
        2：线路长度之外，每多一张牌，+base
    */
    private _mult: number;
    public get mult(): number {
        return this._mult;
    }
    public set mult(v: number) {
        this._mult = v;
    }

    private _cards: number[][][];
    public get cards(): number[][][] {
        return this._cards;
    }
    public set cards(v: number[][][]) {
        this._cards = v;
    }

    private _round: number;
    public get round(): number {
        return this._round;
    }
    public set round(v: number) {
        this._round = v;
    }

    private _goldCard: number[][];
    public get goldCard(): number[][] {
        return this._goldCard;
    }
    public set goldCard(v: number[][]) {
        this._goldCard = v;
    }

    private beiShuArr: number[] = [1, 2, 3, 5];

    private _gaps: number[][];
    public get gaps(): number[][] {
        return this._gaps;
    }
    public set gaps(v: number[][]) {
        this._gaps = v;
    }


    private _oneGold: boolean;
    public get oneGold(): boolean {
        return this._oneGold;
    }
    public set oneGold(v: boolean) {
        this._oneGold = v;
    }

    private rebate: number;
    private payMaxMult: number;
    private roundOneMaxMult: number;

    private _ace: SuperAce;
    private userId: number;
    private auto: boolean;
    private amount: number;
    constructor(app: Application, userId: number, auto: boolean, amount: number) {
        this._ace = superAce(app)
        this.userId = userId;
        this.cards = [];
        this.mult = 0;
        this.auto = auto;
        this.payMaxMult = 15;
        this.rebate = 60;
        this.amount = amount;
        for (let i = 0; i < 5; i++) {
            this.cards.push([[], [], [], []]);
        }
        this.round = 0;
        this.goldCard = [];
    }

    getOneRowCardNums(): number[] {
        let arr = [];
        const shu = this.cards[0];
        for (let j = 0; j < shu.length; j++) {
            let cardNum = this.getCardNum(0, j, 0);
            arr.push(cardNum);
        }
        return arr;
    }

    getTwoRowCardNums(): number[] {
        let arr = [];
        const shu = this.cards[1];
        for (let j = 0; j < shu.length; j++) {
            let cardNum = this.getCardNum(1, j, 0);
            arr.push(cardNum);
        }
        return arr;
    }

    getNomalCard(): number[][] {
        let arr = [];
        for (let i = 1; i < 4; i++) {
            const shu = this.cards[i];
            for (let j = 0; j < shu.length; j++) {
                let cardNum = this.getCardNum(i, j, 0);
                if (cardNum == -1 || cardNum == 1 || cardNum == 2) {
                    continue;
                }
                arr.push([i, j]);
            }
        }
        return arr;
    }

    getThreeRowCardNums(): number[] {
        let arr: number[] = [];
        for (let i = 1; i < 3; i++) {
            const shu = this.cards[i];
            for (let j = 0; j < shu.length; j++) {
                let cardNum = this.getCardNum(i, j, 0);
                arr.push(cardNum);
            }
        }
        return arr;
    }

    getCardNum(shuIndex: number, hengIndex: number, round: number): number {
        let card_shu = this.cards[shuIndex];
        let cardArr = card_shu[hengIndex];
        return cardArr[0];
    }

    setCardNum(shuIndex: number, hengIndex: number, round: number, num: number) {
        let card_shu = this.cards[shuIndex];
        let cardArr = card_shu[hengIndex];
        if (!cardArr) {
            console.log("-----------------card_shu:", card_shu);
        }
        cardArr[0] = num;
    }



    private fillCard(lose: boolean = false) {


        //先清除之前尝试添加的金卡数据
        let delArr: number[][] = [];
        for (let ii = 0; ii < this.goldCard.length; ii++) {
            const gold = this.goldCard[ii];
            for (let jj = 0; jj < this.gaps.length; jj++) {
                const gap = this.gaps[jj];
                if (gold[0] == gap[0] && gold[1] == gap[1]) {
                    delArr.push(gold);
                }
            }
        }

        while (delArr.length > 0) {
            const delIndex = this.goldCard.findIndex(go => go[0] == delArr[0][0] && go[1] == delArr[0][1]);
            delArr.splice(0, 1);
            this.goldCard.splice(delIndex, 1);
        }
        //清除完毕


        let hasone: boolean = false;//第二列有金卡
        let hastwo: boolean = false;//第三列有金卡
        let xiaochou: number[][] = [];
        const lie1 = this.cards[1];
        const lie2 = this.cards[2];
        for (let i = 0; i < lie1.length; i++) {
            const lie1Chinld = lie1[i];
            const lie1Num = lie1Chinld[0];
            if (lie1Num == 1 || lie1Num == 2) {
                hasone = true;
                break;
            }
        }

        for (let i = 0; i < lie2.length; i++) {
            const lie2Chinld = lie2[i];
            const lie2Num = lie2Chinld[0];
            if (lie2Num == 1 || lie2Num == 2) {
                hastwo = true;
                break;
            }
        }


        for (let i = 0; i < this.gaps.length; i++) {
            const card = this.gaps[i];
            let x = card[0];
            let obj1 = this._ace.getNum(i)  //randomRangeInt(1, 9);

            if (lose) {
                if (hasone && hastwo) {
                    if (x == 0) {
                        //只能出小牌
                        obj1.num = randomNum(1, 10) > 5 ? 4 : 6;
                    } else {
                        //要出和第一列不一样的牌
                        //
                        const testArrOne = this.getOneRowCardNums();
                        while (testArrOne.indexOf(obj1.num) >= 0) {
                            obj1.num = randomNum(3, 10);
                        }
                    }
                } else {
                    //鬼出现在第2列，要保证第一列和第三列不能一样
                    //鬼出现在第3列或者没有鬼，要保证第一列和第二列不能一样
                    switch (x) {
                        case 0:
                            obj1.num = randomNum(1, 10) > 5 ? 4 : 6;
                            const testArrTehree = this.getThreeRowCardNums();
                            while (testArrTehree.indexOf(obj1.num) >= 0) {
                                obj1.num = randomNum(3, 10);
                            }
                            break;
                        case 2:
                        case 1:
                            const testArrOne = this.getOneRowCardNums();
                            while (testArrOne.indexOf(obj1.num) >= 0) {
                                obj1.num = randomNum(3, 10);
                            }
                            break;
                    }
                }

                obj1.isGold = false;
            }

            if (obj1.isGold) {
                if (hasone && i != 2)
                    xiaochou.push([card[0], card[1]]);
                if (hastwo && i != 1)
                    xiaochou.push([card[0], card[1]]);
            }

            //e.push(obj1.num);
            this.setCardNum(card[0], card[1], this.round, obj1.num)
        }

        xiaochou.forEach(xc => {
            let index = this.goldCard.findIndex(e => e[0] == xc[0] && e[1] == xc[1]);
            if (index < 0 && xc.length > 0) {
                this.goldCard.push(xc);
            }
        })
    }

    private fillCardOnfirstRound() {
        let xiaochou: number[][] = [];
        this.goldCard = [];
        for (let i = 0; i < 5; i++) {
            const card_shu = this.cards[i];
            for (let j = 0; j < card_shu.length; j++) {
                const e = card_shu[j];

                let obj = this._ace.getNum(i);  //randomRangeInt(1, 9);
                //这是一张金卡
                if (obj.isGold) {
                    xiaochou.push([i, j]);
                }
                //log("e:",e)
                this.setCardNum(i, j, this.round, obj.num);
                xiaochou.forEach(xc => {
                    let index = this.goldCard.findIndex(e => e[0] == xc[0] && e[1] == xc[1]);
                    if (index < 0 && xc.length > 0) {
                        this.goldCard.push(xc);
                    }
                })
            }
        }
    }



    /** 每一轮发牌 */
    async addCardNumOnRound() {
        //bug1:最后一轮? 小丑消除号码还是2  
        console.log("---发牌---:", this.round + 1)
        let multObj: { mult: number, pos: number[][], changToGoldPos: number[][], xiaochou: boolean }
        if (this.round == 0) {
            //第一轮发牌
            this.fillCardOnfirstRound();
            multObj = this.testMult(this.round);
            while (multObj.mult > 5) {
                this.fillCardOnfirstRound();
                multObj = this.testMult(this.round);
            }
            if (multObj.mult > this.roundOneMaxMult) {
                this.roundOneMaxMult = multObj.mult;
            }
        } else {
            //其他轮次的发牌
            for (let i = 0; i < 5; i++) {
                const card_shu = this.cards[i];
                for (let j = 0; j < card_shu.length; j++) {
                    const gapIndex = this.gaps.find(g => g[0] == i && g[1] == j)
                    if (!gapIndex) {
                        const e = card_shu[j];
                        const nowNum = this.getCardNum(i, j, 0);
                        this.setCardNum(i, j, this.round, nowNum);
                    } else {
                        this.setCardNum(i, j, this.round, -1);
                    }
                }
            }

            //尝试补牌
            let noHighMult = randomNum(1, 100) > this.rebate; // false--赔率高，玩家赢 50 < 20  false  

            let lose = this.round >= 3 || noHighMult;
            this.fillCard(lose);
            multObj = this.testMult(this.round);
            let fillCount = 100;
            while (this.mult + multObj.mult > this.payMaxMult && fillCount > 1) {
                // log("------进入循环")
                this.fillCard(true);
                multObj = this.testMult(this.round);
                fillCount--;
            }
            if (fillCount <= 1) {
                console.log("------循环超过了100")
                multObj.mult = 15 - this.mult + randomNum(1, 10) / 10;// 15 - 13 + 0.9
            }
        }

        //log("this,", this.cards);

        //这里会发一组原始的，还未消除的牌
        //包含金卡信息
        let _delayTime = 1500;
        if (this.round == 0) {
            _delayTime = 2400;
            this._ace.sendToUser(this.userId, "ace_game_Begin",{});
            await delayTime(100)
            this._ace.sendToUser(this.userId, "ace_push_card_on_first_round", { goldCard: this.goldCard,cards: this.cards});
          
        } else {
            let data = {
                cards: this.cards,
                goldCard: this.goldCard,
                round: this.round + 1,
                gaps: this.gaps
            }
            this._ace.sendToUser(this.userId, "ace_push_card", data);
        }

        this.gaps = [];
        const id = setTimeout(() => {
            this.resultFillToGame(multObj);
            clearTimeout(id);
        }, _delayTime);
    }

    getCardNumArr(): number[][] {
        return [
            [this.cards[0][0][0], this.cards[0][1][0], this.cards[0][2][0], this.cards[0][3][0]],
            [this.cards[1][0][0], this.cards[1][1][0], this.cards[1][2][0], this.cards[1][3][0]],
            [this.cards[2][0][0], this.cards[2][1][0], this.cards[2][2][0], this.cards[2][3][0]],
            [this.cards[3][0][0], this.cards[3][1][0], this.cards[3][2][0], this.cards[3][3][0]],
            [this.cards[4][0][0], this.cards[4][1][0], this.cards[4][2][0], this.cards[4][3][0]],
        ]
    }

    testMult(index: number) {
        /*  
       计算Mult开始
       1：统计小丑
       2：小丑依次替换成竖1的4张牌
       3：统计线路mult数据
       */
        let allCards = this.getCardNumArr();
        let changToGoldPos: number[][] = null;
        //判断黄金小丑
        let goldXiaoChou = false;
        for (let i = 1; i < allCards.length; i++) {
            const numShu = allCards[i];
            for (let j = 0; j < numShu.length; j++) {
                const num = numShu[j];
                if (num == 1) {
                    goldXiaoChou = true;
                    break;
                }
            }
            if (goldXiaoChou)
                break;
        }

        if (goldXiaoChou) {
            const sanCount = randomNum(2, 3);
            let nomalCards = this.getNomalCard();
            //
            changToGoldPos = [];
            for (let i = 0; i < sanCount; i++) {
                let gIndex = randomNum(0, nomalCards.length - 1);
                let gcard = nomalCards[gIndex];
                if (gcard) {
                    //这里完成了普通卡换大鬼
                    this.setCardNum(gcard[0], gcard[1], index, 1);
                    changToGoldPos.push([gcard[0], gcard[1]])
                    nomalCards.splice(gIndex, 1);
                }
            }
            allCards = this.getCardNumArr();
        }

        let xiaochou: boolean = false;
        //判断普通小丑
        for (let i = 1; i < allCards.length; i++) {
            const numShu = allCards[i];
            for (let j = 0; j < numShu.length; j++) {
                const num = numShu[j];
                if (num == 2) {
                    xiaochou = true;
                    break;
                }
            }
            if (xiaochou)
                break;
        }
        let mult = 0;
        let pos: number[][] = [];
        let arrStr = JSON.stringify(allCards);


        //有小丑  所有小丑都替换成第一张牌，替换得四组数据
        if (xiaochou || goldXiaoChou) {
            let headindex = 0;
            let fourCards: number[][][] = []
            let headnums: number[] = [];
            for (let k = 0; k < 4; k++) {
                const headShu = allCards[0];
                const headNum = headShu[headindex];
                if (headnums.findIndex(f => f == headNum) > -1) {
                    headindex++;
                    continue;
                }
                headnums.push(headNum);
                let cccca = JSON.parse(arrStr);
                for (let i = 1; i < cccca.length; i++) {
                    const numShu = cccca[i];
                    for (let j = 0; j < numShu.length; j++) {
                        const num = numShu[j];
                        if (num == 2 || num == 1) {
                            numShu[j] = headNum;
                            let delindex = this.goldCard.findIndex(e => e[0] == i && e[1] == j)
                            this.goldCard.splice(delindex, 1);
                            // log("headNum:",headNum,"   pos:",[i,j])
                        }
                    }
                }
                fourCards.push(cccca)
                headindex++;
            }

            fourCards.forEach(e => {
                let roundResult = this.testOneArr(e);
                let posTest = roundResult.pos;
                posTest.forEach(t => {
                    let po = pos.findIndex(p => t[0] == p[0] && t[1] == p[1]);
                    if (po < 0) {
                        pos.push(t);
                    }
                })

                for (let m = 0; m < roundResult.multInfo.length; m++) {
                    const multData = roundResult.multInfo[m];
                    const bindex = this.round > 3 ? 3 : this.round;
                    const beishu = this.beiShuArr[bindex];
                    mult += this._ace.getMult(multData.lineNum, multData.row, beishu) * multData.base;
                }
            })


        } else {
            let roundResult = this.testOneArr(allCards);
            for (let m = 0; m < roundResult.multInfo.length; m++) {
                const multData = roundResult.multInfo[m];
                const bindex = this.round > 3 ? 3 : this.round;
                const beishu = this.beiShuArr[bindex];
                mult += this._ace.getMult(multData.lineNum, multData.row, beishu) * multData.base;
            }
            pos = roundResult.pos;
        }
        /* Mult计算完成 */
        const obj: { mult: number, pos: number[][], changToGoldPos: number[][], xiaochou: boolean } = {
            mult: mult,
            pos: pos,
            changToGoldPos: changToGoldPos,
            xiaochou: xiaochou
        }
        return obj;
    }

    /**
     * 把游戏结果数据存入aceInfo里
     */
    resultFillToGame(multObj: { mult: number, pos: number[][], changToGoldPos: number[][], xiaochou: boolean }) {
        /* 把获奖的普通卡消失，金卡变小丑 */
        let pos = multObj.pos;
        
        let gaps: number[][][] = [[], [], [], [], []];
        let delayTime = 1000;//默认一局时间是1秒
        if (multObj.changToGoldPos) {
            // console.log("---------------有金卡--------------:", data.changToGoldPos);
            delayTime = 2000;
        }
        if (multObj.xiaochou && delayTime < 2000)//出现小鬼，游戏时间延迟到1.5秒
            delayTime = 1500;

        if (pos.length < 1)//没翻牌，不用延迟，直接开始下一局
            delayTime = 0;

        //这里会把原始的还未消除的牌做消除处理
        //金卡被消除会替换成大小鬼
        //普通卡被消除会替换成-1
        if (pos.length > 0) {
            this.mult += multObj.mult;
            for (let i = 0; i < pos.length; i++) {
                const element = pos[i];
                let falg = true;
                this.goldCard.forEach(e => {
                    //金卡  转换成小丑z
                    if (e[0] == element[0] && e[1] == element[1]) {
                        falg = false;
                        let isBigXiaoChou = randomNum(1, 101) < 10 ? 1 : 2;//1是大鬼
                        if (this.oneGold) {
                            isBigXiaoChou = 2;
                        }
                        this.setCardNum(element[0], element[1], this.round, isBigXiaoChou);
                        if (isBigXiaoChou == 1) {
                            this.oneGold = true;
                        }
                    }
                })
                //普通卡，  消失
                if (falg) {
                    //this.gaps.push([element[0], element[1]]);
                    this.setCardNum(element[0], element[1], this.round, -1);
                    gaps[element[0]].push([element[0], element[1]])
                }

            }

            this.round++;
            for (let gg = 0; gg < gaps.length; gg++) {
                const ggs = gaps[gg];//[[0,1],[2,4]]
                for (let gs = 0; gs < ggs.length; gs++) {
                    const element = ggs[gs];
                    this.gaps.push([element[0], element[1]])
                }
            }

            const a = new Decimal(this.mult + "");
            const b = new Decimal(this.amount + "");

            const payOut = parseInt(a.times(b).toFixed(0));
            let data = {
                cards: this.cards,
                goldCard: this.goldCard,
                round: this.round,
                changToGoldPos: multObj.changToGoldPos,
                inLine: pos.length > 0,
                payOut: payOut
            }
            this._ace.sendToUser(this.userId, "ace_round_result", data);//告诉客户端当前轮次的结果
            console.log("ace_round_result:",payOut);
            const id = setTimeout(() => {
                console.log("发牌延迟:", delayTime);
                //补牌
                this.addCardNumOnRound();
                clearTimeout(id);
            }, delayTime);


        } else {
            //log("**************一轮游戏结束**************")
            const a = new Decimal(this.mult + "");
            const b = new Decimal(this.amount + "");
            const payOut = parseInt(a.times(b).toFixed(0));

            const coin = this._ace.saveUserCoin(this.userId, payOut);
            const endData = {
                round: this.round,
                auto: this.auto,
                coin: coin,
            }

            delayTime = 0;
            if (this.mult >= 10) {
                delayTime = 5000;
                const bigWinData = {
                    mult: this.mult,
                    payOut: payOut
                }
                this._ace.sendToUser(this.userId, "ace_big_win", bigWinData);
                console.log("-------------ace_big_win:",payOut);
            }

            const iid = setTimeout(() => {
                this._ace.sendToUser(this.userId, "ace_round_end", endData);
                clearTimeout(iid);
            }, delayTime);

            this.round_end(this.mult,payOut);

        }
    }
    
    testOneArr(arr: number[][]): { multInfo: { lineNum: number, row: number, base: number }[], pos: number[][] } {
        let one = arr[0]
        let two = arr[1]
        let three = arr[2]

        let line: number[] = [];
        for (let i = 0; i < one.length; i++) {
            const num1 = one[i]
            if (line.findIndex(n => n == num1) >= 0) {
                break;
            }

            for (let j = 0; j < two.length; j++) {
                const num2 = two[j]

                if (num1 == num2) {
                    for (let k = 0; k < three.length; k++) {
                        const num3 = three[k]
                        if (num1 == num3) {
                            line.push(num1);
                            break;
                        }
                    }
                    break;
                }
            }
        }

        // //中奖的牌
        let pos: number[][] = [];
        let obj: { multInfo: { lineNum: number, row: number, base: number }[], pos: number[][] } = {
            multInfo: [],
            pos: []
        };
        line.forEach(lineNum => {
            let cards = arr;
            let row = 0;
            let base = 1;
            for (let i = 0; i < cards.length; i++) {
                const card_shu = cards[i];
                let shuCount = 0
                for (let j = 0; j < card_shu.length; j++) {
                    const cardNum = card_shu[j];
                    if (cardNum == lineNum) {
                        if (row == i || row == i + 1) {
                            if (row == i)
                                row = i + 1;
                            shuCount++;
                            pos.push([i, j])
                        }
                    }
                }
                if (shuCount > 0)
                    base = base * shuCount;
            }
            /* 
                log("------------------------------------")
                
            */
            // console.log("号码：", lineNum);
            // console.log("线路长度：", row);
            // console.log("线路条数：", base);
            obj.multInfo.push({
                lineNum: lineNum,
                row: row,
                base: base
            })
        })
        obj.pos = pos;
        return obj;
    }

    run() {
        this.addCardNumOnRound();
    }

    private round_end(mult:number,payOut:any) {
        //结算，战绩储存
        this._ace.end_userGame(this.userId,mult,payOut);
    }
}