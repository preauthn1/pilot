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
    private _gameTag: number

    private _configMap: {
        [key: string | number]: {
            minBet: number,
            maxBet: number,
            minMultiple: number,
            maxMultiple: number,
        }
    } = {}


    constructor(private app: Application) {
        this._controlService = app.get('controlService')
    }

    public get minBet() {
        return this._minBet
    }
    public get maxBet() {
        return this._maxBet
    }
    public get minMultiple() {
        return this._minMultiple
    }
    public get maxMultiple() {
        return this._maxMultiple
    }
    public get gameTag() {
        return this._gameTag
    }

    /*
    * 初始化
    * */
    public async load(tag): Promise<boolean> {
        const config = await this._controlService.getGameConfig(tag)
        if (!config) {
            return false
        }
        this._minBet = config.minBet
        this._maxBet = config.maxBet
        this._minMultiple = config.minMultiple
        this._maxMultiple = config.maxMultiple
        this._gameTag = tag
        return true
    }
    public async load2Channel(tag, channel): Promise<boolean> {
        const config = await this._controlService.getGameConfig(tag, channel)//cannel  10023  10025  10066   10077   102657   10011
        if (!config) {
            return false
        }
        this._minBet = config.minBet
        this._maxBet = config.maxBet
        this._minMultiple = config.minMultiple
        this._maxMultiple = config.maxMultiple
        this._gameTag = tag
        return true
    }

    public async getConfigById(channel): Promise<{ minBet: number, maxBet: number, minMultiple: number, maxMultiple: number, }> {
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
        this._gameTag = tag
        return true
    }

    /*
    * 重置
    * */
    private getRule(num: number): number[] {
        switch (num) {

            case 3://红桃
                return [0.1, 0.3, 0.5];
            case 4://梅花
                return [0.05, 0.15, 0.25];
            case 5://黑桃
                return [0.1, 0.3, 0.5];
            case 6://方块
                return [0.05, 0.15, 0.25];
            case 7:   // J
                return [0.2, 0.6, 1];
            case 8:   // Q
                return [0.3, 0.9, 1.5];
            case 9:   // K
                return [0.4, 1.2, 2];
            case 10:   // A
                return [0.5, 1.5, 2.5];
        }
        return []
    }

    getMultByNumAndLength(num: number, length: number, round: number): number {
        let cfg = this.getRule(num);
        if (length - 3 >= 0) {
            return cfg[length - 3] * round;
        } else {
            console.log("--------ACE读取倍数出错:length - 3 < 0");
            return 0;
        }
    }
}
