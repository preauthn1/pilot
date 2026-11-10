import { Application } from "pinus";
import { ControlService } from "../../services/controlService";
import { randomNum } from "../../util/random";

let controlConfig: ControlConfig = null

// 统一创建对象接口
export default function (app: Application) {
    if (controlConfig === null) {
        controlConfig = new ControlConfig(app)
    }
    return controlConfig
}

export class ControlConfig {
    private _controlService: ControlService
    private _gameCode: string
    private _id: number
    private _reserve: number
    private _rebate: number
    private _progress: number
    private _gamemax: number

    private _controlMap: {
        [key: string | number]: {
            reserve: number,
            progress: number,
            rebate: number,
            gamemax: number,

            lowMults: { mult: number, piece: number[], index: number }[],
            nomalMults: { mult: number, piece: number[], index: number }[],
            hightMults: { mult: number, piece: number[], index: number }[]
        }
    } = {}

    constructor(private app: Application) {
        this._controlService = app.get('controlService')
    }

    public async getControlById(channel): Promise<{
        reserve: number, progress: number, rebate: number, gamemax: number,
        lowMults: { mult: number, piece: number[], index: number }[],
        nomalMults: { mult: number, piece: number[], index: number }[],
        hightMults: { mult: number, piece: number[], index: number }[]
    }> {
        let v = this._controlMap[channel.toString()];
        if (v) {
            const risk = await this._controlService.getControlConfig(this._gameCode, channel)
            if (!risk) return null
            Object.assign(v, { reserve: risk.reserve, progress: risk.progress, rebate: risk.rebate, gamemax: risk.gamemax })
            return v;
        }
        if (await this.loadControlByChanel(channel)) {
            return this._controlMap[channel.toString()];
        }
        return null;
    }

    async loadControlByChanel(channel) {
        if (!this._gameCode || channel === null || channel === undefined) {
            return false
        }

        const contro = await this._controlService.getControlConfig(this._gameCode, channel)
        if (!contro) {
            return false
        }
        this._controlMap[channel] = {
            reserve: contro.reserve,
            rebate: contro.rebate,
            progress: contro.progress,
            gamemax: contro.gamemax,

            lowMults: [],
            nomalMults: [],
            hightMults: []
        };
        return true
    }

    // public get gamemax() {
    //     return this._gamemax / 100
    // }

    // public get reserve(){
    //     return 0
    // }

    // public get progress(){
    //     return 0
    // }

    // public get rebate(){
    //     return 0
    // }

    // public get id() {
    //     return this._id
    // }



    public finished() {
        return this._progress >= this._reserve
    }

    public async load(gameCode?: string, channelId?: number | string): Promise<boolean> {
        if (typeof gameCode !== 'string' || !gameCode.trim() || channelId === null || channelId === undefined) {
            return false
        }

        this._gameCode = gameCode.trim().toLowerCase()
        const config = await this._controlService.getControlConfig(this._gameCode, channelId)
        if (!config) {
            return false
        }

        this._controlMap[channelId] = {
            reserve: config.reserve,
            rebate: config.rebate,
            progress: config.progress,
            gamemax: config.gamemax / 100,
            lowMults: [],
            nomalMults: [],
            hightMults: []
        };
        return true
    }

    public async reload(channel, gameCode = this._gameCode): Promise<boolean> {
        if (typeof gameCode !== 'string' || !gameCode.trim() || channel === null || channel === undefined) {
            return false
        }

        this._gameCode = gameCode.trim().toLowerCase()
        const config = await this._controlService.getControlConfig(this._gameCode, channel)
        if (!config) {
            return false
        }

        this._controlMap[channel] = {
            reserve: config.reserve,
            rebate: config.rebate,
            progress: config.progress,
            gamemax: config.gamemax / 100,
            lowMults: [],
            nomalMults: [],
            hightMults: []
        };
        return true
    }

    public async saveProgress(progress: number, channelID) {
        let map = this._controlMap[channelID]
        map.progress += progress
        return this._controlService.saveProgress(progress, channelID, this._gameCode)
    }

    async getMultArrByDifficulty(diff: number, channelId) {
        let map = await this.getControlById(channelId);

        let mults: { mult: number, piece: number[], index: number }[];
        switch (diff) {
            case 0:
                if (map.lowMults.length < 1) {
                    map.lowMults = this.createMultsByDiff(diff, map.rebate, map.gamemax);
                }
                mults = map.lowMults;
                break;
            case 1:
                if (map.nomalMults.length < 1) {
                    map.nomalMults = this.createMultsByDiff(diff, map.rebate, map.gamemax);
                }
                mults = map.nomalMults;
                break;
            case 2:
                if (map.hightMults.length < 1) {
                    map.hightMults = this.createMultsByDiff(diff, map.rebate, map.gamemax);
                }
                mults = map.hightMults;
                break;
        }

        let mult: { mult: number, piece: number[], index: number } = {
            mult: mults[0].mult,
            piece: mults[0].piece,
            index: mults[0].index
        };
        mults.splice(0, 1);
        console.log("-------糖果-------渠道ID:",channelId);
        console.log("-------后台杀率:", map.rebate);
        console.log("-------后台设置的最大倍数:", map.gamemax);
        console.log("-------当前局实际结果(倍数):", mult.mult);
        return mult;
    }

    createMultsByDiff(diff: number, rebate: number, gamemax: number): { mult: number, piece: number[], index: number }[] {
        let opp = this.getMultConfigArr(diff, rebate, gamemax)
        let allweight = 0;
        for (let i = 0; i < opp.length; i++) {
            const element = opp[i];
            allweight += element.weight;
        }

        let arr: { mult: number, piece: number[], index: number }[] = [];
        let nowCut = 0;
        for (let j = 0; j < opp.length; j++) {
            const op = opp[j];
            op.region = Math.floor(nowCut + op.weight / allweight * 10000);
            nowCut += op.weight / allweight * 10000
        }

        function getNum() {
            let randNum = randomNum(1, 10001)
            let start = 0;
            for (let j = 0; j < opp.length; j++) {
                const op = opp[j];
                let obj = {
                    mult: op.mult,
                    piece: op.piece,
                    index: op.tag - 1
                }
                if (op.weight == 0) {
                    obj.mult = 0;
                    arr.push(obj);
                    return
                } else {
                    if (randNum > start && randNum <= op.region) {
                        obj.mult = op.mult;
                        obj.piece = op.piece
                        arr.push(obj);
                        return
                    } else {
                        start = op.region;
                    }
                }
            }
        }

        for (let i = 0; i < 10000; i++) {
            getNum();
        }
        return arr;
    }

    private getMultConfigArr(risk: number, rebate: number, gamemax): { mult: number, piece: number[], tag: number, weight: number, region: number }[] {
        let riskArr: { mult: number, piece: number[], tag: number, weight: number, region: number }[];
        let base = 1 + rebate / 10;
        if (risk == 0) {//low   低赔率
            riskArr = [
                { mult: 0.50, piece: [1, 1, 1], tag: 1, weight: 880 * base, region: 0 }, { mult: 0.80, piece: [1, 1, 2], tag: 2, weight: 700 * base, region: 0 },
                { mult: 1.20, piece: [1, 1, 3], tag: 3, weight: 320, region: 0 }, { mult: 1.50, piece: [1, 2, 3], tag: 4, weight: 230, region: 0 },
                { mult: 2.40, piece: [1, 2, 2], tag: 5, weight: 40, region: 0 }, { mult: 3.48, piece: [1, 3, 3], tag: 6, weight: 20, region: 0 },
                { mult: 5.03, piece: [2, 2, 3], tag: 7, weight: 5, region: 0 }, { mult: 7.00, piece: [2, 2, 2], tag: 8, weight: 1, region: 0 },
                { mult: 15.00, piece: [1, 3, 3], tag: 9, weight: 1, region: 0 }, { mult: 40.00, piece: [3, 3, 3], tag: 10, weight: 0, region: 0 }
            ]
        } else if (risk == 1) {//medium
            riskArr = [
                { mult: 0, piece: [1, 1, 1], tag: 1, weight: 630 * base, region: 0 }, { mult: 0.50, piece: [1, 1, 2], tag: 2, weight: 770 * base, region: 0 },
                { mult: 1.50, piece: [1, 1, 3], tag: 3, weight: 310, region: 0 }, { mult: 2.40, piece: [1, 2, 3], tag: 4, weight: 245, region: 0 },
                { mult: 3.30, piece: [1, 2, 2], tag: 5, weight: 40, region: 0 }, { mult: 7.00, piece: [1, 3, 3], tag: 6, weight: 20, region: 0 },
                { mult: 10.00, piece: [2, 2, 3], tag: 7, weight: 5, region: 0 }, { mult: 14.35, piece: [2, 2, 2], tag: 8, weight: 1, region: 0 },
                { mult: 30.60, piece: [1, 3, 3], tag: 9, weight: 0, region: 0 }, { mult: 80.00, piece: [3, 3, 3], tag: 10, weight: 0, region: 0 }
            ]
        } else if (risk == 2) {//hight  高赔率
            riskArr = [
                { mult: 0, piece: [1, 1, 1], tag: 1, weight: 180 * base, region: 0 }, { mult: 0, piece: [1, 1, 2], tag: 2, weight: 180 * base, region: 0 },
                { mult: 0.50, piece: [1, 1, 3], tag: 3, weight: 42, region: 0 }, { mult: 3.00, piece: [1, 2, 3], tag: 4, weight: 70, region: 0 },
                { mult: 4.20, piece: [1, 2, 2], tag: 5, weight: 20, region: 0 }, { mult: 10.24, piece: [1, 3, 3], tag: 6, weight: 8, region: 0 },
                { mult: 15.00, piece: [2, 2, 3], tag: 7, weight: 1, region: 0 }, { mult: 30.00, piece: [2, 2, 2], tag: 8, weight: 0, region: 0 },
                { mult: 60.00, piece: [1, 3, 3], tag: 9, weight: 0, region: 0 }, { mult: 200.00, piece: [3, 3, 3], tag: 10, weight: 0, region: 0 }
            ]
        }
        let arr: { mult: number, piece: number[], tag: number, weight: number, region: number }[] = [];
        riskArr.forEach(e => {
            if (gamemax < e.mult) {
                e.weight = 0;
            }
            arr.push(e);
        })
        return arr;
    }

}
