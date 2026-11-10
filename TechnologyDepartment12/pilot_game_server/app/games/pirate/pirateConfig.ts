import { Application } from "pinus";
import { ControlService } from "../../services/controlService";

let pirateConfig: PirateConfig = null

// 统一创建对象接口
export default function (app: Application) {
    if (pirateConfig === null) {
        pirateConfig = new PirateConfig(app)
    }
    return pirateConfig
}

export class PirateConfig {

    private _controlService: ControlService;
    private _maxBet: number;
    private _minBet: number;
    public bigWinMult: number;
    public superWinMult: number;
    private _configMap: {
        [key: string | number]: {
            minBet: number,
            maxBet: number,
            minMultiple: number,
            maxMultiple: number,
        }
    } = {}

    constructor(app: Application) {
        this._controlService = app.get("controlService");
        this.bigWinMult = 5;
        this.superWinMult = 10;
    }

    public async getConfigById(channel): Promise<{ minBet: number, maxBet: number, minMultiple: number, maxMultiple: number }> {
        let v = this._configMap[channel.toString()];
        if (v) {
            return v;
        }
        if (await this.loadConfigByChanel(channel)) {
            return this._configMap[channel.toString()];
        }
        return null;
    }

    async loadConfigByChanel(chanel) {
        const config = await this._controlService.getGameConfig(null, chanel)
        if (!config) {
            return false
        }
        this._configMap[chanel] = config;
        return true
    }


    /*
    * 初始化
    * */
    public async loadConfig(_legacyGameTag = null): Promise<boolean> {
        return false
    }

    /*
    * 重置
    * */
    public async reload(tag): Promise<boolean> {
        const config = await this._controlService.getGameConfig(null, tag)
        if (!config) {
            return false
        }
        this._configMap[tag] = config;
        return true
    }

    /*
    * 重置
    * */
    //[3,4]
    getCellInLine(v): Array<any> {
        let data = [];
        if (this.line1[v[1]] == v[0])
            data.push(this.line1);
        if (this.line2[v[1]] == v[0])
            data.push(this.line2);
        if (this.line3[v[1]] == v[0])
            data.push(this.line3);
        if (this.line4[v[1]] == v[0])
            data.push(this.line4);
        if (this.line5[v[1]] == v[0])
            data.push(this.line5);
        if (this.line6[v[1]] == v[0])
            data.push(this.line6);
        if (this.line7[v[1]] == v[0])
            data.push(this.line7);
        if (this.line8[v[1]] == v[0])
            data.push(this.line8);
        if (this.line9[v[1]] == v[0])
            data.push(this.line9);
        if (this.line10[v[1]] == v[0])
            data.push(this.line10);
        return data;
    }

    getLinePos(num: number): number[] {
        switch (num) {
            case 1:
                return this.line1;
            case 2:
                return this.line2;
            case 3:
                return this.line3;
            case 4:
                return this.line4;
            case 5:
                return this.line5;
            case 6:
                return this.line6;
            case 7:
                return this.line7;
            case 8:
                return this.line8;
            case 9:
                return this.line9;
            case 10:
                return this.line10;
        }
    }

    get line1(): number[] {
        return [1, 1, 1, 1, 1]
    }
    get line2(): number[] {
        return [2, 2, 2, 2, 2]
    }
    get line3(): number[] {
        return [3, 3, 3, 3, 3]
    }
    get line4(): number[] {
        return [1, 2, 3, 2, 1]
    }
    get line5(): number[] {
        return [3, 2, 1, 2, 3]
    }
    get line6(): number[] {
        return [2, 1, 1, 1, 2]
    }
    get line7(): number[] {
        return [2, 3, 3, 3, 2]
    }
    get line8(): number[] {
        return [1, 1, 2, 3, 3]
    }
    get line9(): number[] {
        return [3, 3, 2, 1, 1]
    }
    get line10(): number[] {
        return [3, 2, 2, 2, 1]
    }

    getCardRuleByNo(No: number): [number, number][] {
        switch (No) {
            case 2:
            case 3:
                return [[2, 2], [3, 25], [4, 125], [5, 750]]
            case 4:
                return [[3, 20], [4, 100], [5, 400]]
            case 5:
            case 6:
                return [[3, 15], [4, 75], [5, 250]]
            case 7:
            case 8:
                return [[3, 10], [4, 50], [5, 125]]
            case 9:
            case 10:
            case 11:
                return [[3, 5], [4, 25], [5, 100]]
            case 1:
                return [[2, 2], [3, 5], [4, 25], [5, 100]]
            case 12:
                return [[2, 10], [3, 250], [4, 2500], [5, 9000]]
            case -1:
                return []
        }
    }

}
