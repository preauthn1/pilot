import { Application, scheduleJob } from "pinus";
import { ControlService } from "../../services/controlService";
import { weight, genUserIds, genUsername, multiple, randomNumber, genBetCount } from "./algorithm";

let robot: Robot = null

export default function (app: Application) {
    if (robot === null) {
        robot = new Robot(app)
    }
    return robot
}

export class Robot {
    private _robots = new Map<string, AviatorRobot>()

    constructor(private app: Application) {
    }

    public async init(): Promise<boolean> {
        return true
    }

    public async resetRobot(channel: number | string, gameCode: string): Promise<boolean> {
        return await this.getRobot(channel, gameCode).resetRobot()
    }

    public async resetGame(channel: number | string, gameCode: string): Promise<boolean> {
        return await this.getRobot(channel, gameCode).resetGame()
    }

    public async bet(times: number, gameCode: string, channel: number | string) {
        return await this.getRobot(channel, gameCode).bet(times)
    }

    private getRobot(channel: number | string, gameCode: string): AviatorRobot {
        const normalizedGameCode = gameCode.trim().toLowerCase()
        const key = `${channel}:${normalizedGameCode}`
        let aviatorRobot = this._robots.get(key)
        if (!aviatorRobot) {
            aviatorRobot = new AviatorRobot(this.app, channel, normalizedGameCode)
            this._robots.set(key, aviatorRobot)
        }
        return aviatorRobot
    }
}

class AviatorRobot {
    private _robotInfos: { userId: number, username: string, index: number, betCount: number, multiple: number, auto: boolean, cashOut: boolean }[]
    private _statusJob: number;
    private _controlService: ControlService
    private _robotConfig: { multipleRange: { minMultiple: number, maxMultiple: number, chance: number, base: number }[], betRange: { minMultiple: number, maxMultiple: number, chance: number, base: number }[], bettingOdds: number, robotNumberMin: number, robotNumberMax: number, robotEnabled: number }
    private _gameConfig: { minBet: number, maxBet: number, minMultiple: number, maxMultiple: number }
    private _probability: { section: { maxMultiple: number, minMultiple: number, startSection: number, lastSection: number, base: number }[], lastSection: number }
    private _betRange: { section: { maxMultiple: number, minMultiple: number, startSection: number, lastSection: number, base: number }[], lastSection: number }
    private _status: boolean
    constructor(private app: Application, private channel: number | string, private gameCode: string) {
        this._controlService = app.get('controlService')
        this._robotInfos = []
        this._status = false
    }

    private async reset(): Promise<boolean> {
        this._robotInfos = []
        this._probability = weight(this._robotConfig.multipleRange);
        this._betRange = weight(this._robotConfig.betRange);
        const userIds = genUserIds(this._robotConfig.robotNumberMax);
        //const userIds = genUserIds(30);
        userIds.forEach(e => {
            this._robotInfos.push({ userId: e, username: genUsername(), index: 0, betCount: 0, multiple: 0, auto: true, cashOut: false })
        })
        this._status = true
        return true
    }

    public async resetRobot(): Promise<boolean> {
        if (!await this.resetGame()) {
            return false
        }
        const robotConfig = await this._controlService.getRobotConfig(this.channel, this.gameCode);
        if (!robotConfig) {
            return false
        }
        this._robotConfig = robotConfig
        return this.reset()
    }

    public async resetGame(): Promise<boolean> {
        const gameConfig = await this._controlService.getGameConfig(this.gameCode, this.channel)
        if (!gameConfig) {
            return false
        }
        this._gameConfig = gameConfig
        return true
    }

    public async bet(times: number) {
        if (!this._status && !await this.resetRobot()) return
        // console.log('机器人下注', this._status, this._robotInfos.length);
        if (!this._status) {
            return
        }
        // 检查机器人开关
        if (!this._robotConfig.robotEnabled) {
            console.log('机器人已关闭，跳过下注');
            return
        }
        const aviatorServer = this.app.getServersByType('aviator')
        let task = []

        // 随机决定本轮参与下注的机器人数量（下限 ~ 上限）
        const minCount = Math.max(1, this._robotConfig.robotNumberMin || 1);
        const maxCount = Math.min(this._robotInfos.length, this._robotConfig.robotNumberMax || this._robotInfos.length);
        const betRobotCount = randomNumber(minCount, maxCount + 1)
        // 打乱顺序后取前 betRobotCount 个作为本轮下注机器人
        this._robotInfos.sort(function (b, a) { return 0.5 - Math.random() })
        const activeRobots = this._robotInfos.slice(0, betRobotCount)
        // console.log('本轮机器人下注数量', betRobotCount, '范围[', minCount, ',', maxCount, ']');

        // 为选中的机器人分配下注信息
        activeRobots.forEach(e => {
            e.index = 1

            const betCount = genBetCount(this._betRange)
            e.betCount = betCount > this._gameConfig.maxBet ? this._gameConfig.maxBet : betCount < this._gameConfig.minBet ? this._gameConfig.minBet : betCount
            e.multiple = parseInt(multiple(this._probability) + "")  // 根据配置获取倍数
            e.auto = true
            e.cashOut = false
        })
        // 再次打乱下注的机器人顺序
        activeRobots.sort(function (b, a) { return 0.5 - Math.random() })
        let beginIndex = 0;
        this._statusJob = scheduleJob({
            start: Date.now() + 200,
            period: 500,
            count: (times / 500)
        }, () => {
            let betCount = randomNumber(1, 4)
            const betRobot = activeRobots.slice(beginIndex, betCount + beginIndex);
            beginIndex += betCount
            betRobot.forEach(e => {
                task.push(this.app.rpc.aviator.remote.robotBet.toServer(aviatorServer[0].id, e, this.gameCode))
            })
        });
        return await Promise.all(task)
    }

}
