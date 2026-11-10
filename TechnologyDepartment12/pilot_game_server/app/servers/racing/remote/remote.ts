import { Application, FrontendSession, RemoterClass } from "pinus";
import aviator, { Racing, STATUS } from "../../../games/racing";
import controlConfig, { ControlConfig } from "../../../games/racing/controlConfig";
import gameConfig, {GameConfig} from "../../../games/racing/gameConfig";

export default function(app: Application) {
    return new Remote(app)
}

declare global {
    interface UserRpc {
        racing: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private _racing: Racing
    private _gameConfig: GameConfig
    private _controlConfig: ControlConfig
    constructor(private app: Application) {
        this._racing = aviator(app)
        this._gameConfig = gameConfig(app)
        this._controlConfig = controlConfig(app)
    }
    // 玩家掉线
    public async offline(userId: number) {
        return this._racing.offline(userId)
    }
    // 停止游戏
    public stopGame() {
        return this._racing.stop()
    }
    // 踢出所有玩家
    public async kickAll(){
        return await this._racing.kickAll()
    }
    // 机器人下注
    public robotBet(robotBetInfo: any){
        //console.log("机器人e.betCount:sssssssssssssss",robotBetInfo,this._racing.robotBet);
        this._racing.robotBet(robotBetInfo)
    }
    // 加载游戏配置
    public async reload(channel) {
        return await this._gameConfig.reload(channel)
    }
    // 加载控制配置
    public async reloadControl(v) {
        return await this._controlConfig.reload(v)
    }
    // 增加观察者
    public async addObserver(observerId: number): Promise<boolean> {
        return await this._racing.addObserver(observerId)
    }
    // 移除观察者
    public async removeObserver(observerId: number){
        return this._racing.removeObserver(observerId)
    }

    public async sendToClient(){
        await this._racing.sendToAll("config",{})
    }
    public async forceEnd(roundId: number, operatorId: number): Promise<number>{
       
        // if(roundId != this._racing.roundId){
        //     return 4
        // }
        // if(this._racing.status !== STATUS.GAME){
        //     return 5
        // }
        // if(!await this._racing.forceEnd(roundId, operatorId)){
        //     return 6
        // }
        return 0
    }

    filterUser(userId: number): boolean {
        if (!this._racing.getUserInfo(userId))
            return false
        else
            return true;
    }

    public async increaseCoin(userId: number, coin: number): Promise<number> {
        if (coin <= 0) {
            return 1
        }
        if (!this._racing.getUserInfo(userId)) {
            return 4
        }
        if (this._racing.betTimes(userId) > 0) {
            return 5
        }
        if (!await this._racing.increaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }

    public async decreaseCoin(userId: number, coin: number): Promise<number> {
        if (coin < 0) {
            return 1
        }
        if (!this._racing.getUserInfo(userId)) {
            return 4
        }
        if (this._racing.betTimes(userId) > 0) {
            return 5
        }
        if (!await this._racing.decreaseCoin(userId, coin)) {
            return 6
        }
        return 0
    }

}
