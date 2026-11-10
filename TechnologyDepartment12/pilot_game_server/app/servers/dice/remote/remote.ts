import { Application, FrontendSession, RemoterClass } from "pinus";
import dice, { Dice } from "../../../games/dice";
import controlConfig, { ControlConfig } from "../../../games/dice/controlConfig";
import gameConfig, { GameConfig } from "../../../games/dice/gameConfig";

export default function (app: Application) {
    return new Remote(app)
}

declare global {
    interface UserRpc {
        dice: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private _dice: Dice
    private _gameConfig: GameConfig
    private _controlConfig: ControlConfig
    constructor(private app: Application) {
        this._dice = dice(app)
        this._gameConfig = gameConfig(app)
        this._controlConfig = controlConfig(app)
    }
    // 玩家掉线
    public async offline(userId: number) {
        return this._dice.offline(userId)
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
        await this._dice.sendToAll("config", {})
    }
    filterUser(userId: number): boolean {
        if (!this._dice.getUserInfo(userId))
            return false
        else
            return true;
    }

    public async increaseCoin(userId: number, coin: number): Promise<number> {
        if (coin <= 0) {
            return 1
        }
        if (!this._dice.getUserInfo(userId)) {
            return 4
        }
        // if (this._dice.betTimes(userId) > 0) {
        //     return 5
        // }
        if (!await this._dice.increaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }

    public async decreaseCoin(userId: number, coin: number): Promise<number> {
        if (coin < 0) {
            return 1
        }
        if (!this._dice.getUserInfo(userId)) {
            return 4
        }
        // if (this._dice.betTimes(userId) > 0) {
        //     return 5
        // }
        if (!await this._dice.decreaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }
}
