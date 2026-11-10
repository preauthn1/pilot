import { Application } from "pinus";
import { ControlService } from "../../services/controlService";
import { randomNum, weightedRandomSelection } from "../../util/random";

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
            Object.assign(v, { reserve: risk.reserve, progress: risk.progress, rebate: risk.rebate, gamemax: risk.gamemax / 100 })
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
            gamemax: contro.gamemax / 100,

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



    public async finished(channelID: number) {
        let map = await this.getControlById(channelID)
        return map.progress >= map.reserve
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
        if (progress == 0)
            return;
        let map = await this.getControlById(channelID);
        map.progress += progress;
        return this._controlService.saveProgress(progress, channelID, this._gameCode)
    }

    async getMultArrByDifficulty(diff: number, channelId) {
        let map = await this.getControlById(channelId);
        if (map.rebate < 0 || map.rebate > 9) {
            map.rebate = 5;
        }
        let rebate: number = map.rebate;//await this.finished(channelId) ? map.rebate : -21;

        return this.getMultOnRebate(diff,rebate,map.gamemax);
    }

    private lowArr = [
        { mult: 0.50, piece: [1, 1, 1], tag: 1 }, { mult: 0.80, piece: [1, 1, 2], tag: 2 },
        { mult: 1.20, piece: [1, 1, 3], tag: 3 }, { mult: 1.50, piece: [1, 2, 3], tag: 4 },
        { mult: 2.40, piece: [1, 2, 2], tag: 5 }, { mult: 3.48, piece: [1, 3, 3], tag: 6 },
        { mult: 5.03, piece: [2, 2, 3], tag: 7 }, { mult: 7.00, piece: [2, 2, 2], tag: 8 },
        { mult: 15.00, piece: [1, 3, 3], tag: 9 }, { mult: 40.00, piece: [3, 3, 3], tag: 10 }
    ]

    private lowWeight = [880 * 1, 700 * 1, 320, 230, 40, 20, 5, 1, 1, 0]

    private nomArr = [
        { mult: 0, piece: [1, 1, 1], tag: 1 }, { mult: 0.50, piece: [1, 1, 2], tag: 2 },
        { mult: 1.50, piece: [1, 1, 3], tag: 3 }, { mult: 2.40, piece: [1, 2, 3], tag: 4 },
        { mult: 3.30, piece: [1, 2, 2], tag: 5 }, { mult: 7.00, piece: [1, 3, 3], tag: 6 },
        { mult: 10.00, piece: [2, 2, 3], tag: 7 }, { mult: 14.35, piece: [2, 2, 2], tag: 8 },
        { mult: 30.60, piece: [1, 3, 3], tag: 9 }, { mult: 80.00, piece: [3, 3, 3], tag: 10 }
    ]

    private nomWeight = [630 * 1, 770 * 1, 310, 245, 40, 20, 5, 1, 0, 0]

    private hightArr = [
        { mult: 0, piece: [1, 1, 1], tag: 1 }, { mult: 0, piece: [1, 1, 2], tag: 2 },
        { mult: 0.50, piece: [1, 1, 3], tag: 3 }, { mult: 3.00, piece: [1, 2, 3], tag: 4 },
        { mult: 4.20, piece: [1, 2, 2], tag: 5 }, { mult: 10.24, piece: [1, 3, 3], tag: 6 },
        { mult: 15.00, piece: [2, 2, 3], tag: 7 }, { mult: 30.00, piece: [2, 2, 2], tag: 8 },
        { mult: 60.00, piece: [1, 3, 3], tag: 9 }, { mult: 200.00, piece: [3, 3, 3], tag: 10 }
    ]
    private heightWeight = [180 * 1, 180 * 1, 42, 70, 20, 8, 1, 0, 0, 0]

    private copyWeights(risk: number,base:number): number[] {
        let baseWeight:number[] =[]
        switch (risk) {
            case 0:
                baseWeight = this.lowWeight;
                break;
            case 1:
                baseWeight = this.nomWeight;
                break;
            case 2:
                baseWeight = this.heightWeight;
                break;
        }
        const str = JSON.stringify(baseWeight);
        let weights:number[] = JSON.parse(str);
        weights[0] = weights[0] * base;
        weights[1] = weights[1] * base;
        return weights;
    }

    private getMultOnRebate(risk: number, rebate: number, gamemax:number):{ mult: number, piece: number[], tag: number } {
        let base = 1 + rebate / 50;
        let weights: number[] = this.copyWeights(risk,base);
        let pieces = [];
        switch (risk) {
            case 0:
                pieces = this.lowArr;
                break;
            case 1:
                pieces = this.nomArr;
                break;
            case 2:
                pieces = this.hightArr;
                break;
        }
        let pieData: { mult: number, piece: number[], tag: number } = weightedRandomSelection(pieces,weights);
        while (pieData.mult > gamemax) {
            pieData = weightedRandomSelection(pieces,weights);
        }
        return pieData;
    }

  
}
