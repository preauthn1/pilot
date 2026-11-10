import { Application, FrontendSession, RemoterClass } from "pinus";
import controlConfig, { TigerControlConfig } from "../../../games/tiger/tigerControlConfig";
import gameConfig, { TigerConfig } from "../../../games/tiger/tigerConfig";
import tiger, { Tiger} from "../../../games/tiger";
import tigerConfig from "../../../games/tiger/tigerConfig";
import tigerControlConfig from "../../../games/tiger/tigerControlConfig";

export default function (app: Application) {
    return new Remote(app)
}

declare global {
    interface UserRpc {
        tiger: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private _tiger: Tiger
    private _gameConfig: TigerConfig
    private _controlConfig:  TigerControlConfig
    private _app
    constructor(private app: Application) {
        this._tiger = tiger(app)
        this._gameConfig =  tigerConfig(app);
        this._controlConfig = tigerControlConfig(app);
        this._app = app
    }
    // 玩家掉线
    public async offline(userId: number) {
        return this._tiger.offline(userId)
    }
    // 停止游戏
    public stopGame() {
        return this._tiger.stop()
    }
    // 踢出所有玩家
    public async kickAll() {
        return await this._tiger.kickAll()
    }
    // 机器人下注
    // public robotBet(robotBetInfo: any) {
    //     this._tiger.robotBet(robotBetInfo)
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
        if (!this._tiger.getUserInfo(userId))
            return false
        else
            return true;
    }

    // // 增加观察者
    // public async addObserver(observerId: number): Promise<boolean> {
    //     return await this._tiger.addObserver(observerId)
    // }
    // // 移除观察者
    // public async removeObserver(observerId: number) {
    //     return this._tiger.removeObserver(observerId)
    // }

    // public async sendToClient() {
    //     await this._tiger.sendToAll("config", {})
    // }

    public async increaseCoin(userId: number, coin: number): Promise<number> {
        if (coin <= 0) {
            return 1
        }
        if (!this._tiger.getUserInfo(userId)) {
            return 4
        }
        if (this._tiger.betTimes(userId) > 0) {
            return 5
        }
        if (!await this._tiger.increaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }

    public async decreaseCoin(userId: number, coin: number): Promise<number> {
        if (coin < 0) {
            return 1
        }
        if (!this._tiger.getUserInfo(userId)) {
            return 4
        }
        if (this._tiger.betTimes(userId) > 0) {
            return 5
        }
        if (!await this._tiger.decreaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }


}
