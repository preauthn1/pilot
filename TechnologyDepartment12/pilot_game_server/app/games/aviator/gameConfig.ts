import { channel } from "diagnostics_channel";
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
    private _gameMaxMultiple: number
    private _gameStatus: number

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

    public async getConfigById(channel): Promise<{ minBet: number, maxBet: number,minMultiple: number,maxMultiple: number,}> {
        let v = this._configMap[channel.toString()];
        if (v) {
            return v;
        }
        if (await this.loadConfigByChanel(channel)) {
            return this._configMap[channel.toString()];
        }
        return null;
    }

    // public async getMinBet(channel:number) {
    //     let v = this._configMap[channel.toString()]
    //     if(v){
    //         return v.minBet;
    //     }
    //     await this.loadConfigByChanel(channel);
    //     return this._configMap[channel.toString()].minBet;
    // }
    // public async getMaxBet(channel:number) {
    //     let v = this._configMap[channel.toString()]
    //     if(v){
    //         return v.maxBet;
    //     }
    //     await this.loadConfigByChanel(channel);
    //     return this._configMap[channel.toString()].maxBet;
    // }
    // public  get minMultiple() {
    //     return this._minMultiple;
    // }
    // public  get maxMultiple() {
    //     return this._maxMultiple;
    // }
    public get gameMaxMultiple() {
        return this._gameMaxMultiple
    }
    public get gameStatus() {
        return this._gameStatus
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
    public async reload(channel): Promise<boolean> {
        const config = await this._controlService.getGameConfig(null,channel)
        if (!config) {
            return false
        }
        this._configMap[channel] = config;
        return true
    }

    /*
    * 重置
    * */
}
