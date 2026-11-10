import { Application, FrontendSession, RemoterClass } from "pinus";
import clearMinesControlConfig, { ClearMinesControlConfig } from "../../../games/clearMines/ClearMinesControlConfig";
import clearMinesConfig, { ClearMinesConfig } from "../../../games/clearMines/ClearMinesConfig";
import clearMines, { ClearMines } from "../../../games/clearMines";

export default function (app: Application) {
    return new Remote(app)
}

declare global {
    interface UserRpc {
        clearMines: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private _clearMines: ClearMines
    private _gameConfig: ClearMinesConfig
    private _controlConfig:  ClearMinesControlConfig
    private _app
    constructor(private app: Application) {
        this._clearMines = clearMines(app)
        this._gameConfig =  clearMinesConfig(app);
        this._controlConfig = clearMinesControlConfig(app);
        this._app = app
    }
    // 玩家掉线
    public async offline(userId: number) {
        return this._clearMines.offline(userId)
    }
    // 停止游戏
    public stopGame() {
        return this._clearMines.stop()
    }
    // 踢出所有玩家
    public async kickAll() {
        return await this._clearMines.kickAll()
    }
    // 机器人下注
    // public robotBet(robotBetInfo: any) {
    //     this._clearMines.robotBet(robotBetInfo)
    // }
    // 加载游戏配置
    public async reload() {
        return await this._gameConfig.reload(this._app.get('serverTag').mines)
    }
    // 加载控制配置
    public async reloadControl(tag) {
        return await this._controlConfig.reload(tag)
    }

    filterUser(userId: number): boolean {
        if (!this._clearMines.getUserInfo(userId))
            return false
        else
            return true;
    }

    // // 增加观察者
    // public async addObserver(observerId: number): Promise<boolean> {
    //     return await this._clearMines.addObserver(observerId)
    // }
    // // 移除观察者
    // public async removeObserver(observerId: number) {
    //     return this._clearMines.removeObserver(observerId)
    // }

    // public async sendToClient() {
    //     await this._clearMines.sendToAll("config", {})
    // }

    public async increaseCoin(userId: number, coin: number): Promise<number> {
        if (coin <= 0) {
            return 1
        }
        if (!this._clearMines.getUserInfo(userId)) {
            return 4
        }
        if (this._clearMines.betTimes(userId) > 0) {
            return 5
        }
        if (!await this._clearMines.increaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }

    public async decreaseCoin(userId: number, coin: number): Promise<number> {
        if (coin < 0) {
            return 1
        }
        if (!this._clearMines.getUserInfo(userId)) {
            return 4
        }
        if (this._clearMines.betTimes(userId) > 0) {
            return 5
        }
        if (!await this._clearMines.decreaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }


}
