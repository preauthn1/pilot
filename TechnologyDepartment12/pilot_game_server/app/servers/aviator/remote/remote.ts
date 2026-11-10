import { Application, FrontendSession, RemoterClass } from "pinus";
import aviator, { Aviator, STATUS } from "../../../games/aviator";
import controlConfig, { ControlConfig } from "../../../games/aviator/controlConfig";
import gameConfig, { GameConfig } from "../../../games/aviator/gameConfig";

export default function (app: Application) {
    return new Remote(app)
}

declare global {
    interface UserRpc {
        aviator: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private _aviator: Aviator
    private _gameConfig: GameConfig
    private _controlConfig: ControlConfig
    private _app
    constructor(private app: Application) {
        this._aviator = aviator(app)
        this._gameConfig = gameConfig(app)
        this._controlConfig = controlConfig(app)
        this._app = app
    }
    // 玩家掉线
    public async offline(userId: number, gameCode: string) {
        return this._aviator.offline(userId, gameCode)
    }
    // 停止游戏
    public stopGame() {
        return this._aviator.stop()
    }
    // 踢出所有玩家
    public async kickAll(gameCode: string) {
        return await this._aviator.kickAll(gameCode)
    }
    // 机器人下注
    public robotBet(robotBetInfo: any, gameCode: string) {
        this._aviator.robotBet(robotBetInfo, gameCode)
    }
    // 加载游戏配置
    public async reload(channel, gameCode: string) {
        if (!gameCode) return false
        return await this._gameConfig.reload(channel)
    }
    // 加载控制配置
    public async reloadControl(channel, gameCode: string) {
        if (!gameCode) return false
        return await this._controlConfig.reload(channel, gameCode)
    }
    // 增加观察者
    public async addObserver(observerId: number, gameCode: string): Promise<boolean> {
        return await this._aviator.addObserver(observerId, gameCode)
    }
    // 移除观察者
    public async removeObserver(observerId: number, gameCode: string) {
        return this._aviator.removeObserver(observerId, gameCode)
    }

    public async sendToClient(gameCode: string) {
        return await this._aviator.sendToGame(gameCode, "config", {})
    }
    public async forceEnd(roundId: number, operatorId: number, gameCode: string): Promise<number> {
        const room = this._aviator.getRoomByRoundId(roundId, gameCode)
        if (!room) {
            return 4
        }
        if (room.status !== STATUS.GAME) {
            return 5
        }
        if (!await this._aviator.forceEnd(roundId, operatorId, gameCode)) {
            return 6
        }
        return 0
    }

    filterUser(userId: number, gameCode: string): boolean {
        if (!this._aviator.getUserInfo(userId, gameCode))
            return false
        else
            return true;
    }

    public async increaseCoin(userId: number, coin: number, gameCode: string): Promise<number> {
        if (coin <= 0) {
            return 1
        }
        if (!this._aviator.getUserInfo(userId, gameCode)) {
            return 4
        }
        if (this._aviator.betTimes(userId, gameCode) > 0) {
            return 5
        }
        if (!await this._aviator.increaseCoin(userId, coin, gameCode)) {
            return 6
        }
        return 0
    }

    public async decreaseCoin(userId: number, coin: number, gameCode: string): Promise<number> {
        if (coin < 0) {
            return 1
        }
        if (!this._aviator.getUserInfo(userId, gameCode)) {
            return 4
        }
        if (this._aviator.betTimes(userId, gameCode) > 0) {
            return 5
        }
        if (!await this._aviator.decreaseCoin(userId, coin, gameCode)) {
            return 6
        }
        return 0
    }

}
