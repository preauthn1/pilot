import { Application, FrontendSession, RemoterClass } from "pinus";
import jump, { Jump } from "../../../games/jump";
import jumpConfig,{ JumpConfig } from "../../../games/jump/JumpConfig";
import jumpControlConfig,{ JumpControlConfig } from "../../../games/jump/JumpControlConfig";

export default function (app: Application) {
    return new Remote(app)
}

declare global {
    interface UserRpc {
        jump: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private _jump: Jump
    private _gameConfig: JumpConfig
    private _controlConfig:  JumpControlConfig
    private _app
    constructor(private app: Application) {
        this._jump = jump(app)
        this._gameConfig =  jumpConfig(app);
        this._controlConfig = jumpControlConfig(app);
        this._app = app
    }
    // 玩家掉线
    public async offline(userId: number) {
        return this._jump.offline(userId)
    }
    // 停止游戏
    public stopGame() {
        return this._jump.stop()
    }
    // 踢出所有玩家
    public async kickAll() {
        return await this._jump.kickAll()
    }
    // 机器人下注
    // public robotBet(robotBetInfo: any) {
    //     this._jump.robotBet(robotBetInfo)
    // }
    // 加载游戏配置
    public async reload() {
        return await this._gameConfig.reload(this._app.get('serverTag').pirate)
    }
    // 加载控制配置
    public async reloadControl(tag) {
        return await this._controlConfig.reload(tag)
    }
    // // 增加观察者
    // public async addObserver(observerId: number): Promise<boolean> {
    //     return await this._jump.addObserver(observerId)
    // }
    // // 移除观察者
    // public async removeObserver(observerId: number) {
    //     return this._jump.removeObserver(observerId)
    // }

    // public async sendToClient() {
    //     await this._jump.sendToAll("config", {})
    // }


    // public async increaseCoin(userId: number, coin: number): Promise<number> {
    //     if (coin <= 0) {
    //         return 1
    //     }
    //     if (!this._jump.getUserInfo(userId)) {
    //         return 4
    //     }
    //     if (this._jump.betTimes(userId) > 0) {
    //         return 5
    //     }
    //     if (!await this._jump.increaseCoin(userId, coin)) {
    //         return 6
    //     }
    //     return 0
    // }



}
