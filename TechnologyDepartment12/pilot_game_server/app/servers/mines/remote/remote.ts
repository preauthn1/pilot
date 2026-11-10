import { Application, FrontendSession, RemoterClass } from "pinus";
import mines, { Mines } from "../../../games/mines";
import controlConfig, { ControlConfig } from "../../../games/mines/controlConfig";
import gameConfig, { GameConfig } from "../../../games/mines/gameConfig";

export default function (app: Application) {
    return new Remote(app)
}

declare global {
    interface UserRpc {
        mines: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private _mines: Mines
    private _gameConfig: GameConfig
    private _controlConfig: ControlConfig
    private _app
    constructor(private app: Application) {
        this._mines = mines(app)
        this._gameConfig = gameConfig(app)
        this._controlConfig = controlConfig(app)
        this._app = app
    }

    // 玩家掉线
    public async offline(userId: number) {
        return this._mines.offline(userId)
    }

    // 加载游戏配置
    public async reload() {
        return await this._gameConfig.reload(this._app.get('serverTag').aviator)
    }
    // 加载控制配置
    public async reloadControl(tag) {
        return await this._controlConfig.reload(tag)
    }
    
    
    
    filterUser(userId: number): boolean {
        if (!this._mines.getUserInfo(userId))
            return false
        else
            return true;
    }


    public async increaseCoin(userId: number, coin: number): Promise<number> {
        if (coin <= 0) {
            return 1
        }
        if (!this._mines.getUserInfo(userId)) {
            return 4
        }
        if (this._mines.betTimes(userId) > 0) {
            return 5
        }
        if (!await this._mines.increaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }

    public async decreaseCoin(userId: number, coin: number): Promise<number> {
        if (coin < 0) {
            return 1
        }
        if (!this._mines.getUserInfo(userId)) {
            return 4
        }
        if (this._mines.betTimes(userId) > 0) {
            return 5
        }
        if (!await this._mines.decreaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }
}
