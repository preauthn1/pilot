import { Application, FrontendSession, RemoterClass } from "pinus";
import controlConfig, { PirateControlConfig } from "../../../games/pirate/pirateControlConfig";
import gameConfig, { PirateConfig } from "../../../games/pirate/pirateConfig";
import pirate, { Pirate } from "../../../games/pirate";
import pirateConfig from "../../../games/pirate/pirateConfig";
import pirateControlConfig from "../../../games/pirate/pirateControlConfig";

export default function (app: Application) {
    return new Remote(app)
}

declare global {
    interface UserRpc {
        pirate: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private _pirate: Pirate
    private _gameConfig: PirateConfig
    private _controlConfig:  PirateControlConfig
    private _app
    constructor(private app: Application) {
        this._pirate = pirate(app)
        this._gameConfig =  pirateConfig(app);
        this._controlConfig = pirateControlConfig(app);
        this._app = app
    }
    // 玩家掉线
    public async offline(userId: number) {
        return this._pirate.offline(userId)
    }
    // 停止游戏
    public stopGame() {
        return this._pirate.stop()
    }
    // 踢出所有玩家
    public async kickAll() {
        return await this._pirate.kickAll()
    }
    // 机器人下注
    // public robotBet(robotBetInfo: any) {
    //     this._pirate.robotBet(robotBetInfo)
    // }
    // 加载游戏配置
    public async reload(chanel) {
        return await this._gameConfig.reload(chanel)
    }
    // 加载控制配置
    public async reloadControl(tag) {
        return await this._controlConfig.reload(tag)
    }

    filterUser(userId: number): boolean {
        if (!this._pirate.getUserInfo(userId))
            return false
        else
            return true;
    }

    // // 增加观察者
    // public async addObserver(observerId: number): Promise<boolean> {
    //     return await this._pirate.addObserver(observerId)
    // }
    // // 移除观察者
    // public async removeObserver(observerId: number) {
    //     return this._pirate.removeObserver(observerId)
    // }

    // public async sendToClient() {
    //     await this._pirate.sendToAll("config", {})
    // }

    public async increaseCoin(userId: number, coin: number): Promise<number> {
        if (coin <= 0) {
            return 1
        }
        if (!this._pirate.getUserInfo(userId)) {
            return 4
        }
        if (this._pirate.betTimes(userId) > 0) {
            return 5
        }
        if (!await this._pirate.increaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }

    public async decreaseCoin(userId: number, coin: number): Promise<number> {
        if (coin < 0) {
            return 1
        }
        if (!this._pirate.getUserInfo(userId)) {
            return 4
        }
        if (this._pirate.betTimes(userId) > 0) {
            return 5
        }
        if (!await this._pirate.decreaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }


}
