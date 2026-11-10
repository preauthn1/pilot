import { Application, FrontendSession, RemoterClass } from "pinus";
import triple, { Triple } from "../../../games/triple";
import controlConfig, { ControlConfig } from "../../../games/triple/controlConfig";
import gameConfig, { GameConfig } from "../../../games/triple/gameConfig";

export default function (app: Application) {
    return new Remote(app)
}

declare global {
    interface UserRpc {
        triple: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private _triple: Triple
    private _gameConfig: GameConfig
    private _controlConfig: ControlConfig
    constructor(private app: Application) {
        this._triple = triple(app)
        this._gameConfig = gameConfig(app)
        this._controlConfig = controlConfig(app)
    }
    // 玩家掉线
    public async offline(userId: number) {
        return this._triple.offline(userId)
    }
    // 加载游戏配置
    public async reload(tag) {
        return await this._gameConfig.reload(tag)
    }
    // 加载控制配置
    public async reloadControl(tag) {
        return await this._controlConfig.reload(tag)
    }
    public async sendToClient() {
        await this._triple.sendToAll("config", {})
    }
    filterUser(userId: number): boolean {
        if (!this._triple.getUserInfo(userId))
            return false
        else
            return true;
    }

    public async increaseCoin(userId: number, coin: number): Promise<number> {
        if (coin <= 0) {
            return 1
        }
        if (!this._triple.getUserInfo(userId)) {
            return 4
        }
        // if (this._triple.betTimes(userId) > 0) {
        //     return 5
        // }
        if (!await this._triple.increaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }

    public async decreaseCoin(userId: number, coin: number): Promise<number> {
        if (coin < 0) {
            return 1
        }
        if (!this._triple.getUserInfo(userId)) {
            return 4
        }
        // if (this._triple.betTimes(userId) > 0) {
        //     return 5
        // }
        if (!await this._triple.decreaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }
}


