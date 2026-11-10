import { Application } from "pinus";
import { ControlService } from "../../services/controlService";

let clearMinesConfig: ClearMinesConfig = null

// 统一创建对象接口
export default function (app: Application) {
    if (clearMinesConfig === null) {
        clearMinesConfig = new ClearMinesConfig(app)
    }
    return clearMinesConfig
}

export class ClearMinesConfig {

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

        return true
    }

    /*
    * 重置
    * */
    private multsDis: { [key: string | number]: number[] } = {
        1: [1.01, 1.08, 1.12, 1.18, 1.24, 1.30, 1.37, 1.46, 1.55, 1.65, 1.77, 1.90, 2.06, 2.25, 2.47, 2.75, 3.09, 3.54, 4.12, 4.95, 6.19, 8.25, 12.38, 24.75],
        2: [1.08, 1.17, 1.29, 1.41, 1.56, 1.74, 1.94, 2.18, 2.47, 2.83, 3.26, 3.81, 4.50, 5.40, 6.60, 8.25, 10.61, 14.14, 19.80, 29.70, 49.50, 99, 297],
        3: [1.12, 1.29, 1.48, 1.71, 2.00, 2.35, 2.79, 3.35, 4.07, 5.00, 6.26, 7.96, 10.35, 13.8, 18.97, 27.11, 40.66, 65.06, 113.85, 227.7, 569.25, 2277],
        4: [1.18, 1.41, 1.71, 2.09, 2.58, 3.23, 4.09, 5.26, 6.88, 9.17, 12.51, 17.52, 25.3, 37.95, 59.64, 99.39, 178.91, 357.81, 834.9, 2504, 12523],
        5: [1.24, 1.56, 2, 2.58, 3.39, 4.52, 6.14, 8.5, 12.04, 17.52, 26.27, 40.87, 66.41, 113.85, 208.72, 417.45, 939.26, 2504, 8766, 52598],
        6: [1.3, 1.74, 2.35, 3.23, 4.52, 6.46, 9.44, 14.17, 21.89, 35.03, 53.33, 102.17, 189.75, 379.5, 834.9, 2087, 6261, 25047, 175329],
        7: [1.37, 1.94, 2.79, 4.09, 6.14, 9.44, 14.95, 24.47, 41.6, 3.95, 138.66, 277.33, 606.87, 1442, 3956, 13219, 59486, 475893],
        8: [1.46, 2.18, 3.35, 5.26, 8.05, 14.17, 24.47, 44.05, 83.2, 166.4, 356.56, 831.98, 2163, 6489, 23794, 118973, 1070759],
        9: [1.55, 2.47, 4.07, 6.88, 12.04, 21.89, 41.6, 83.2, 176.8, 404.1, 1010, 2828, 9193, 9, 14, 36773, 202254, 2022545],
        10: [1.65, 2.83, 5, 9.17, 17.52, 35.03, 73.95, 166.4, 404.1, 1077, 3232, 11314, 19031, 294188, 3236072],
        11: [1.77, 3.26, 6.26, 12.51, 26.77, 58.38, 136.66, 356.56, 1010, 3232, 12123, 56574, 367735, 4412826],
        12: [1.9, 3.81, 7.96, 17.52, 40.87, 102.17, 277.33, 831.98, 2828, 11314, 56574, 396022, 5148297],
        13: [2.06, 4.5, 10.35, 25.3, 66.41, 189.75, 600.87, 2163, 9193, 49031, 367735, 5148297],
        14: [2.25, 5.4, 13.8, 37.95, 113.85, 379.5, 1442, 6489, 36773, 294188, 4412826],
        15: [2.47, 6.6, 18.97, 59.64, 208.72, 834.9, 3965, 23794, 202254, 3236072],
        16: [2.75, 8.25, 27.11, 99.39, 417.45, 2087, 13219, 118973, 2022545],
        17: [3.09, 10.61, 40.66, 178.91, 939.26, 6261, 59486, 1070759],
        18: [3.54, 14.14, 65.06, 357.81, 2504, 25047, 475893],
        19: [4.12, 19.8, 113.85, 834.9, 8766, 175329],
        20: [4.95, 29.7, 227.7, 2504, 52598],
        21: [6.19, 49.5, 569.25, 12523],
        22: [8.25, 99, 2277],
        23: [12.37, 297],
        24: [24.7],
    };


    public getMultsByMinesCount(mines: number): number[] {
        return this.multsDis[mines];
    }







}
