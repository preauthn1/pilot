import { Application } from "pinus";
import { ControlService } from "../../services/controlService";

let gameConfig: GameConfig = null

// 统一创建对象接口
export default function (app: Application) {
    if (gameConfig === null) {
        gameConfig = new GameConfig(app)
    }
    return gameConfig
}

export class GameConfig {
    private _controlService: ControlService
    private _minBet: number
    private _maxBet: number
    private _minMultiple: number
    private _maxMultiple: number
    private _carCount: number
    private _speedArr: number[];
    private _lapLength: number;

    private _configMap: {
        [key: string | number]: {
            minBet: number,
            maxBet: number,
            minMultiple: number,
            maxMultiple: number,
            timeContent: string
        }
    } = {}

    constructor(private app: Application) {
        this._controlService = app.get('controlService')
        // this._speedArr = [180, 190, 210, 220, 230, 270];
    }

    public async getConfigById(channel): Promise<{ minBet: number, maxBet: number, minMultiple: number, maxMultiple: number, timeContent: string }> {
        let v = this._configMap[channel.toString()];
        if (v) {
            return v;
        }
        if (await this.loadConfigByChanel(channel)) {
            return this._configMap[channel.toString()];
        }
        return null;
    }

    public async getGameTimeByChannel(channel: number | string): Promise<number[]> {
        const cfg = await this.getConfigById(channel);
        if (!cfg.timeContent)
            return null;
        const strArr = cfg.timeContent.split("_")
        return [parseInt(strArr[0]), parseInt(strArr[1])]
    }


    async loadConfigByChanel(chanel) {
        const config = await this._controlService.getGameConfig(null, chanel)
        if (!config) {
            return false
        }
        this._configMap[chanel] = config;
        return true
    }

    public get speedArr() {
        return this._speedArr
    }

    public get carCount() {
        return this._carCount
    }

    /** 跑道长度 */
    public get lapLength() {
        return this._lapLength;
    }
    /*
    * 初始化
    * */
    public async load(tag): Promise<boolean> {

        const config = await this._controlService.getGameConfig(tag)
        if (!config) {
            console.log("赛车  config_load:false");

            return false
        }

        this._minBet = config.minBet;
        this._maxBet = config.maxBet;
        this._carCount = config.carCount;
        // this._minMultiple = config.minMultiple
        // this._maxMultiple = config.maxMultiple
        this._speedArr = [235, 240, 245, 250, 255, 260];
        this._lapLength = 7000;
        return true
    }
    /*
    * 重置
    * */
    public async reload(tag): Promise<boolean> {
        const config = await this._controlService.getGameConfig(null, tag)
        if (!config) {
            return false
        }
        this._minBet = config.minBet
        this._maxBet = config.maxBet
        this._minMultiple = config.minMultiple
        this._maxMultiple = config.maxMultiple
        return true
    }

    /*
    * 重置
    * */
}
