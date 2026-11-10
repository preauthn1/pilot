import { Application, FrontendSession, RemoterClass } from "pinus";
import controlConfig, { ControlConfig } from "../../../games/superAce/controlConfig";
import gameConfig, { GameConfig } from "../../../games/superAce/gameConfig";
import superAce, { SuperAce } from "../../../games/superAce";

export default function (app: Application) {
    return new Remote(app)
}

declare global {
    interface UserRpc {
        superAce: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private _ace: SuperAce
    private _gameConfig: GameConfig
    private _controlConfig: ControlConfig
    constructor(private app: Application) {
        this._ace = superAce(app)
        this._gameConfig = gameConfig(app)
        this._controlConfig = controlConfig(app)
    }
    // 玩家掉线
    public async offline(userId: number) {
        return this._ace.offline(userId)
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
        await this._ace.sendToAll("config", {})
    }
    filterUser(userId: number): boolean {
        if (!this._ace.getUserInfo(userId))
            return false
        else
            return true;
    }

    public async increaseCoin(userId: number, coin: number): Promise<number> {
        if (coin <= 0) {
            return 1
        }
        if (!this._ace.getUserInfo(userId)) {
            return 4
        }
        // if (this._ace.betTimes(userId) > 0) {
        //     return 5
        // }
        if (!await this._ace.increaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }

    public async decreaseCoin(userId: number, coin: number): Promise<number> {
        if (coin < 0) {
            return 1
        }
        if (!this._ace.getUserInfo(userId)) {
            return 4
        }
        // if (this._dice.betTimes(userId) > 0) {
        //     return 5
        // }
        if (!await this._ace.decreaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }
}
