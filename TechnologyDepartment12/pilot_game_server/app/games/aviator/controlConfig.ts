import { Application, getLogger } from "pinus"
import { ControlService } from "../../services/controlService"
import { systemDateString } from "../../util/time"

const logger = getLogger("aviator")
let controlConfig: ControlConfig = null

export default function (app: Application) {
    if (controlConfig === null) controlConfig = new ControlConfig(app)
    return controlConfig
}

export class ControlConfig {
    private readonly controlService: ControlService
    private controlMap: { [key: string]: { reserve: number, progress: number, progressDate: string, rebate: number, gamemax: number } } = {}
    private dailyResetTimer: NodeJS.Timer | null = null

    public constructor(app: Application) {
        this.controlService = app.get('controlService')
    }

    public async getControlById(channelId: number, gameCode: string) {
        const key = this.makeKey(channelId, gameCode)
        const cached = this.controlMap[key]
        if (cached && cached.progressDate === systemDateString()) return cached
        return this.reloadAndGet(channelId, gameCode)
    }

    public async reload(channelId: number, gameCode: string): Promise<boolean> {
        return !!await this.reloadAndGet(channelId, gameCode)
    }

    public async reloadAndGet(channelId: number, gameCode: string) {
        const config = await this.controlService.getControlConfig(gameCode, channelId)
        if (config) this.controlMap[this.makeKey(channelId, gameCode)] = config
        return config
    }

    public async shouldKill(channelId: number, gameCode: string): Promise<boolean> {
        const config = await this.getControlById(channelId, gameCode)
        return config.progress < config.reserve
    }

    public async saveProgress(progress: number, channelId: number, gameCode: string) {
        if (progress === 0) return
        const config = await this.getControlById(channelId, gameCode)
        config.progress += progress
        return this.controlService.saveProgress(progress, channelId, gameCode)
    }

    public scheduleDailyReset() {
        if (this.dailyResetTimer) return
        const now = new Date()
        const midnight = new Date(now)
        midnight.setHours(24, 0, 0, 0)
        this.dailyResetTimer = setTimeout(() => {
            this.controlMap = {}
            this.dailyResetTimer = setInterval(() => { this.controlMap = {} }, 24 * 60 * 60 * 1000)
        }, midnight.getTime() - now.getTime())
        logger.info('daily risk cache reset scheduled')
    }

    private makeKey(channelId: number, gameCode: string): string {
        return `${channelId}:${typeof gameCode === 'string' ? gameCode.trim().toLowerCase() : ''}`
    }
}
