import {Application, scheduleJob} from "pinus";
import { isAwaitExpression } from "typescript";
import {ControlService} from "../../services/controlService";
import { getRandomNum } from "../../util/random";
import {weight, genUserIds, genUsername, multiple, randomNumber,  genBetCount} from "./algorithm";

let robot_Car:Robot_Car = null

export default function (app: Application) {
    if (robot_Car === null) {
        robot_Car = new Robot_Car(app)
    }
    return robot_Car
}

export class Robot_Car {
    private _robotInfos: {userId: number,username: string,index: number,betCount: number}[]
    private _statusJob: number;
    private _controlService: ControlService
    private _robotConfig: {betRange:string[],robotNumber: number}
    private _gameConfig: {minBet: number, maxBet: number, minMultiple: number, maxMultiple: number}
    private _probability: {section: {maxMultiple: number, minMultiple: number, startSection: number, lastSection:number,base: number}[], lastSection: number}
    private _betRange: string[];
    private _status: boolean
    constructor(private app: Application) {
        this._controlService = app.get('controlService')
        this._robotInfos = []
        this._status = false

    }

    private async reset(): Promise<boolean>{
        this._robotInfos = []
     //   this._probability = weight(this._robotConfig.multipleRange);
        this._betRange = this._robotConfig.betRange;//weight(this._robotConfig.betRange);
        const userIds = genUserIds(this._robotConfig.robotNumber);
      //  console.log('赛车数量:',this._robotConfig.robotNumber);
        
        //const userIds = genUserIds(1)
        userIds.forEach(e => {
            this._robotInfos.push({userId: e, username: genUsername(), index: 0, betCount: 0})
        })
        this._status = true
        return true
    }

    public async resetRobot(v:number): Promise<boolean>{
        const robotConfig  = await this._controlService.getRobotConfig_racing(v)
        if (!robotConfig){
            return false
        }
        this._robotConfig = robotConfig
        return this.reset()
    }

    public async resetGame(channel: number | string): Promise<boolean>{
        const gameConfig = await this._controlService.getGameConfig_racing(channel)
        if (!gameConfig){
            return false
        }
        this._gameConfig = gameConfig
        return true
    }

    public async bet(times: number){
        if (!this._status){
            return
        }
        
        const aviatorServer = this.app.getServersByType('racing')
        let task = []
        // 开始下注
        this._robotInfos.forEach(e => {
                e.index = getRandomNum(1, 7);
                const betCount = genBetCount(this._betRange) * 100;
                e.betCount = betCount > this._gameConfig.maxBet? this._gameConfig.maxBet: betCount < this._gameConfig.minBet? this._gameConfig.minBet: betCount;
                
        })
        this._robotInfos.sort(function(b,a){return 0.5-Math.random()})
        let beginIndex = 0;

        let doBet = (indexii:number,e)=> {
            let tid = setTimeout(() => {
                task.push(this.app.rpc.racing.remote.robotBet.toServer(aviatorServer[0].id, e));
                clearTimeout(tid);
            }, 300 * indexii);
        }

        this._statusJob = scheduleJob({
            start: Date.now() + 200,
            period: 1000,
            count: (times / 1000)
        }, () => {
            let betCount = randomNumber(1,4)
            const betRobot = this._robotInfos.slice(beginIndex, betCount + beginIndex);
            beginIndex += betCount
            for (let i = 0; i < betRobot.length; i++) {
                const element = betRobot[i];
                doBet(i,element);
            }
            // betRobot.forEach(e => {
            //     //console.log("机器人e.betCount:",e.betCount);

            //     task.push(this.app.rpc.racing.remote.robotBet.toServer(aviatorServer[0].id, e))
            // })
        });

       return await Promise.all(task)
    }

}
