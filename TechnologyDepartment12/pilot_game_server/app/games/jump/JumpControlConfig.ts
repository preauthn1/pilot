import { Application } from "pinus";
import { ControlService } from "../../services/controlService";

let jump_controlConfig: JumpControlConfig = null

// 统一创建对象接口
export default function (app: Application) {
    if (jump_controlConfig === null) {
        jump_controlConfig = new JumpControlConfig(app)
    }
    return jump_controlConfig
}

export class JumpControlConfig {
    private _controlService: ControlService
    private _gameCode: string

    //reserve, progress, rebate,game_max as gamemax 
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
    }

    public async getControlById(channel): Promise<{ reserve: number, progress: number,rebate: number,gamemax: number,}> {
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

    // public get gameMax(){
    //     return this._gameMax;
    // }
    // public get reserve() {
    //     return this._reserve
    // }
    // public get rebate() {
    //     return this._rebate
    // }
    // public get progress() {
    //     return this._progress
    // }
    // public get id() {
    //     return this._id
    // }
    // public set progress(value: number) {
    //     this._progress = value
    // }

    public async finished(channelID:number) {
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

    public async saveProgress(progress: number,channelID) {
        if(progress == 0)
            return;
        let map = await this.getControlById(channelID);
        map.progress += progress;
        return this._controlService.saveProgress(progress, channelID, this._gameCode)
    }

}

