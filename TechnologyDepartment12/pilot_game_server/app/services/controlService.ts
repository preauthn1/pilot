import { Application } from "pinus";
import controlDao, { ControlDao } from "../dao/controlDao";

export default function (app: Application) {
    return new ControlService(app)
}

export class ControlService {

    private _controlDao: ControlDao
    private _serverInfo: { name: string, tag: string, channel: string }[]
    private _globalRiskConfigByGameCode: { [gameCode: string]: { id: number, reserve: number, progress: number, progressDate: string, rebate: number, gamemax: number, gameCode: string } } = {}
    private _progressWriteQueueByGameCode: { [gameCode: string]: Promise<unknown> } = {}
    private _globalGameRiskVersion = 0

    public constructor(private app: Application) {
        this._serverInfo = []
        this._controlDao = controlDao(app)
    }

    async getChannelById(channelId:number|string){
        const lim = await this._controlDao.getChannel(channelId)
        let res = lim.results;
        if (res.length !== 1) {
            return "-"
        }
        return res[0];
    }

    public async getChannelCurrencyTag(channelId: number | string): Promise<string | null> {
        const response = await this._controlDao.getChannelCurrencyTag(channelId)
        if (response.results.length !== 1) return null
        const tag = response.results[0].tag
        if (typeof tag !== 'string' || !tag.trim()) return null
        return tag.trim()
    }

    public async getGlobalGameRiskRebate(gameCode: string): Promise<number | null> {
        const response = await this._controlDao.getGlobalGameRiskConfig(gameCode)
        if (response.results.length !== 1) return null
        const rebate = Number(response.results[0].rebate)
        return Number.isInteger(rebate) && rebate >= 1 && rebate <= 99 ? rebate : null
    }

    public async getGlobalBetConfig(gameCode: string): Promise<{ initialBet: number, btnBet: string, minBet: number, maxBet: number } | null> {
        const response = await this._controlDao.getGlobalBetConfig(gameCode)
        if (response.results.length !== 1) return null
        const config = response.results[0]
        const initialBet = Number(config.initialBet)
        const minBet = Number(config.minBet)
        const maxBet = Number(config.maxBet)
        if (!Number.isSafeInteger(initialBet) || !Number.isSafeInteger(minBet) || !Number.isSafeInteger(maxBet)
            || initialBet < minBet || initialBet > maxBet || minBet <= 0 || maxBet < minBet
            || typeof config.btnBet !== 'string' || !config.btnBet.trim()) {
            return null
        }
        return { initialBet, btnBet: config.btnBet, minBet, maxBet }
    }

    public async getRobotConfig_racing(v): Promise<{ betRange: string[], robotNumber: number }> {
        let config = await this._controlDao.getRobotConfig_racing(v)
        let configResults = config.results
        if (configResults.length !== 1) {
            return null
        }
        const betRange: string[] = configResults[0].betRange.split(",")//
        return {
            betRange: betRange,
            robotNumber: configResults[0].robotNumber
        }
    }

    public async getRobotConfig(channel, gameCode: string): Promise<{ multipleRange: { minMultiple: number, maxMultiple: number, chance: number, base: number }[], betRange: { betBase: number, minMultiple: number, maxMultiple: number, chance: number, base: number }[], bettingOdds: number, robotNumberMin: number, robotNumberMax: number, robotEnabled: number }> {
        let config = await this._controlDao.getRobotConfig(channel, gameCode)
        let configResults = config.results
        if (configResults.length !== 1) {
            return null
        }
        let minMultiple = 1.1
        const multipleRange: string[] = configResults[0].multipleRange.split(";")
        const betRange: string[] = configResults[0].betRange.split(";")
        let multipleResult = []
        let betResult = []
        console.log("parseInt(range[0]):", multipleRange);
        multipleRange.forEach(e => {
            const range = e.split(',')

            if (range.length !== 3) {

                return
            }

            // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@:",range[1]);
            multipleResult.push({
                minMultiple: minMultiple,
                maxMultiple: parseInt(range[1]),
                chance: parseInt(range[2]),
                base: parseInt(range[0])

            })
            //  minMultiple = parseInt(range[0])
        })
        betRange.forEach(e => {
            const range = e.split(',')
            if (range.length !== 3) {
                return
            }
            betResult.push({
                base: parseInt(range[0]) * 100,
                minMultiple: 1.1,
                maxMultiple: parseInt(range[1]),
                chance: parseInt(range[2])
            })
        })
        // 解析 robotNumber：支持 "30"（固定）或 "5,30"（范围）
        const robotNumberRaw = String(configResults[0].robotNumber || '0');
        let robotNumberMin = 0;
        let robotNumberMax = 0;
        if (robotNumberRaw.includes(',')) {
            const parts = robotNumberRaw.split(',');
            robotNumberMin = parseInt(parts[0]) || 0;
            robotNumberMax = parseInt(parts[1]) || 0;
        } else {
            robotNumberMin = parseInt(robotNumberRaw) || 0;
            robotNumberMax = robotNumberMin;
        }
        return {
            multipleRange: multipleResult,
            betRange: betResult,
            bettingOdds: configResults[0].bettingOdds,
            robotNumberMin: robotNumberMin,
            robotNumberMax: robotNumberMax,
            robotEnabled: configResults[0].robotEnabled != null ? Number(configResults[0].robotEnabled) : 1
        }
    }

    public async getPirateConfig(): Promise<{ id: number, reserve: number, progress: number, rebate: number }> {
        let config = await this._controlDao.getControlConfig(10014)
        let configResults = config.results
        if (configResults.length !== 1) {
            return null
        }
        return {
            id: configResults[0].id,
            reserve: configResults[0].reserve,
            progress: configResults[0].progress,
            rebate: configResults[0].rebate
        }
    }

    public async getGameConfig_pirate(channelId): Promise<any> {
        let config = await this._controlDao.getGameConfig_pirate(channelId)
        let configResults = config.results
        if (configResults.length !== 1) {
            return null
        }
        return {
            minBet: configResults[0].minBet,
            maxBet: configResults[0].maxBet,
            minMultiple: configResults[0].minMultiple,
            maxMultiple: configResults[0].maxMultiple
        }
    }

    public async getGameConfig_racing(channel): Promise<any> {
        let config = await this._controlDao.getGameConfig_racing(channel)
        let configResults = config.results
        if (configResults.length !== 1) {
            return null
        }
        return {
            minBet: configResults[0].minBet,
            maxBet: configResults[0].maxBet,
            minMultiple: configResults[0].minMultiple,
            maxMultiple: configResults[0].maxMultiple
        }
    }

    public async getGameConfig(gameCode: string | number, channel = null): Promise<any> {
        if (channel === null || channel === undefined) return null
        let config = await this._controlDao.getGameConfig(channel, gameCode)
        let configResults = config.results
        if (configResults.length !== 1) {
            return null
        }
        return {
            minBet: configResults[0].minBet,
            maxBet: configResults[0].maxBet,
            minMultiple: configResults[0].minMultiple,
            maxMultiple: configResults[0].maxMultiple
        }
    }

    public async getControlConfig(gameCode: string, channel: number | string): Promise<{ id: number, reserve: number, progress: number, progressDate: string, rebate: number, gamemax: number, gameCode: string }> {
        if (!gameCode || channel === null || channel === undefined) return null
        const normalizedGameCode = gameCode.trim().toLowerCase()
        const config = await this._controlDao.getControlConfig(channel, normalizedGameCode)
        if (config.results.length !== 1) return null
        const channelRiskConfig = config.results[0]
        this._globalRiskConfigByGameCode[normalizedGameCode] = { ...channelRiskConfig, gamemax: 0, gameCode: normalizedGameCode }
        this._globalGameRiskVersion += 1
        return { ...channelRiskConfig, gameCode: normalizedGameCode }
    }

    public getGlobalGameRiskVersion(): number {
        return this._globalGameRiskVersion
    }

    public async saveProgress(progressDelta: number, _channelId, requestedGameCode: string | number = null) {
        if (typeof requestedGameCode !== 'string' || !requestedGameCode || progressDelta === 0) {
            return { results: { affectedRows: 0 } }
        }

        const configuredRisk = await this._controlDao.getGlobalGameRiskConfig(requestedGameCode)
        if (configuredRisk.results.length !== 1) {
            return { results: { affectedRows: 0 } }
        }
        const gameCode = configuredRisk.results[0].gameCode
        const progressDate = configuredRisk.results[0].progressDate

        const previousWrite = this._progressWriteQueueByGameCode[gameCode] || Promise.resolve()
        const write = previousWrite.then(async () => {
            const result = await this._controlDao.saveGlobalGameRiskProgress(progressDelta, gameCode, progressDate)
            const cachedConfig = this._globalRiskConfigByGameCode[gameCode]
            if (cachedConfig && result.results.affectedRows > 0) {
                if (cachedConfig.progressDate !== progressDate) {
                    cachedConfig.progress = 0
                    cachedConfig.progressDate = progressDate
                }
                cachedConfig.progress += progressDelta
                this._globalGameRiskVersion += 1
            }
            return result
        })
        this._progressWriteQueueByGameCode[gameCode] = write.catch(() => undefined)
        return write
    }

    public async isGameEnabled(gameCode: string): Promise<boolean> {
        const result = await this._controlDao.isGameEnabled(gameCode)
        return result.results.length === 1
    }

    public clearGlobalGameRiskCache(gameCode: number | string) {
        if (typeof gameCode === 'string') {
            delete this._globalRiskConfigByGameCode[gameCode.trim().toLowerCase()]
        }
        this._globalGameRiskVersion += 1
    }

    public async saveProgressA(progress: number, id: number) {
        return await this._controlDao.saveProgressA(progress, id)
    }

    public async restRacingRate(channelId){
        return null
    }

    public async resetProgressByChannel(channelId: number) {
        return await this._controlDao.resetProgressByChannel(channelId)
    }

    public async getWalletType(channelId):Promise<number>{
        let type = await this._controlDao.getWalletType(channelId);
        console.log("-----------getWalletType:",channelId,type.results[0].type);
        
        if (type.results.length !== 1) {
            return null
        }
        return type.results[0].type
    }
}
