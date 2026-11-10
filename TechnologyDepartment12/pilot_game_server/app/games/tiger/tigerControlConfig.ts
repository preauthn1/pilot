import { Application } from "pinus";
import { ControlService } from "../../services/controlService";

let tiger_controlConfig: TigerControlConfig = null

// 统一创建对象接口
export default function (app: Application) {
    if (tiger_controlConfig === null) {
        tiger_controlConfig = new TigerControlConfig(app)
    }
    return tiger_controlConfig
}

export class TigerControlConfig {
    private _controlService: ControlService
    private _serverTag;
    private _gameCode: string
    private _id: number
    private _reserve: number
    private _rebate: number
    private _progress: number
    private _maxPayOut: number

    private _controlMap: {
        [key: string | number]: {
            reserve: number,
            progress: number,
            rebate: number,
            gamemax: number,
        }
    } = {}

    constructor(private app: Application) {
        this._controlService = app.get('controlService')
        this._serverTag = app.get('serverTag');
        //console.log(" ",!this._controlService);
        this._reserve = 0
        this._rebate = 0
        this._progress = 0
        this._maxPayOut = 250
    }

    get threeGirdData() {
        return { "card_1": 3, "card_2": 5, "card_3": 8, "card_4": 10, "card_5": 25, "card_6": 100, "card_7": 250 }
    }

    getThreeGirdWeight(channelId: string | number): number[] {
        const rebate = this.getControlById(channelId);
        return []
    }

    public async getControlById(channel): Promise<{ reserve: number, progress: number, rebate: number, gamemax: number, }> {
        let v = this._controlMap[channel.toString()];
        if (v) {
            await this.loadControlByChanel(channel)
            return this._controlMap[channel.toString()];
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
        this._controlMap[channel] = contro;
        return true
    }

    public get id() {
        return this._id
    }
    public set progress(value: number) {
        this._progress = value
    }

    public async finished(channelId) {
        let map = await this.getControlById(channelId);
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

        this._controlMap[channelId] = config;
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

        this._controlMap[channel] = config;
        return true
    }

    public async saveProgress(progress: number, channelId) {
        if (progress == 0) {
            return;
        }
        let map = await this.getControlById(channelId);
        map.progress += progress
        //console.log('海盗水池：',this._serverTag.pirate);
        return this._controlService.saveProgress(progress, channelId, this._gameCode);
    }

    /*
    * 重置
    * */
}
