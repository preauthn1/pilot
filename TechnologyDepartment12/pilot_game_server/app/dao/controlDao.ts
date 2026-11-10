import { Application } from "pinus"
import { Dao } from "./dao"
import { systemDateString } from "../util/time"

export default function (app: Application) {
    return new ControlDao(app)
}

export class ControlDao extends Dao {
    private progressDateColumnAvailable: boolean | null = null

    public constructor(app: Application) {
        super(app)
    }

    async getChannel(channelID:number|string) {
        const sql = 'select * from mms_channel where id = ?'
        return this.select(sql, [channelID])
    }

    async getChannelCurrencyTag(channelId: number | string) {
        const sql = 'select tag from cms_currency_setting where channel_id = ? order by id asc limit 1'
        return this.select(sql, [channelId])
    }

    async saveProgressA(_progress: number, _id: number) {
        return { results: { affectedRows: 0 } }
    }


    async getRobotConfig_racing(v) {
        const sql = 'select robot_number as robotNumber,bet_range as betRange  from cms_robot_setting where channel= ? limit 1'
        
        return this.select(sql, [v])
    }

    async getRobotConfig(channel: number|string, gameCode: string) {
        const sql = 'select multiple_range as multipleRange, betting_odds as bettingOdds, robot_number as robotNumber, robot_enabled as robotEnabled, bet_range as betRange from cms_robot_setting where channel = ? and game_code = ? limit 1'
        return this.select(sql, [channel, gameCode])
    }

    async getGameConfig_pirate(channelId) {
        const sql = 'select bet_min as minBet, bet_max as maxBet,game_max as carCount from cms_game_setting  where channel=? limit 1'
        return this.select(sql, [channelId])
    }

    async getGameConfig_racing(v) {
        const sql = 'select bet_min as minBet, bet_max as maxBet, settlement_min as minMultiple, settlement_max as maxMultiple,game_max as carCount from cms_game_setting  where channel= ?  limit 1'
        return this.select(sql, [v])
    }

    async getGameConfig(channel, gameCode: string | number = null) {
        if (typeof gameCode === 'string' && gameCode.trim()) {
            const mappedSql = 'select gs.bet_min as minBet, gs.bet_max as maxBet, gs.settlement_min as minMultiple, gs.settlement_max as maxMultiple ' +
                'from channel_game_config cgc inner join cms_game_setting gs on gs.id = cgc.game_setting_id ' +
                'where cgc.channel_id = ? and cgc.game_code = ? and cgc.status = 1 limit 1'
            const mapped = await this.select(mappedSql, [channel, gameCode.trim()])
            if (mapped.results.length === 1) {
                return mapped
            }
        }
        const sql = 'select bet_min as minBet, bet_max as maxBet, settlement_min as minMultiple, settlement_max as maxMultiple from cms_game_setting where channel = ? limit 1'
        return this.select(sql, [channel])
    }

    public async isGameEnabled(gameCode: string) {
        const sql = 'select 1 from game_risk_control where game_code = ? and status = 1 and deleted_at is null limit 1'
        return this.select(sql, [gameCode])
    }

    public async getGlobalGameRiskConfig(gameCode: string, progressDate = systemDateString()) {
        if (this.progressDateColumnAvailable === false) return this.getLegacyGlobalGameRiskConfig(gameCode, progressDate)
        const sql = 'select id, game_code as gameCode, reserve, case when progress_date = ? then progress else 0 end as progress, ? as progressDate, rebate from game_risk_control where game_code = ? and status = 1 and deleted_at is null'
        try {
            const result = await this.select(sql, [progressDate, progressDate, gameCode])
            this.progressDateColumnAvailable = true
            return result
        } catch (error) {
            if (!this.isMissingProgressDateColumn(error)) throw error
            this.progressDateColumnAvailable = false
            return this.getLegacyGlobalGameRiskConfig(gameCode, progressDate)
        }
    }

    public async getGlobalBetConfig(gameCode: string) {
        const sql = 'select initial_bet as initialBet, btn_bet as btnBet, bet_min as minBet, bet_max as maxBet from game_risk_control where game_code = ? and status = 1 and deleted_at is null limit 1'
        return this.select(sql, [gameCode])
    }

    private async getChannelGameMax(channel: number | string, gameCode: string) {
        const sql = 'select gs.game_max as gamemax from channel_game_config cgc inner join cms_game_setting gs on gs.id = cgc.game_setting_id where cgc.channel_id = ? and cgc.game_code = ? and cgc.status = 1 limit 1'
        return this.select(sql, [channel, gameCode])
    }

    public async saveGlobalGameRiskProgress(progressDelta: number, gameCode: string | number, progressDate = systemDateString()) {
        if (typeof gameCode !== 'string') return { results: { affectedRows: 0 } }
        if (this.progressDateColumnAvailable === false) return this.saveLegacyGlobalGameRiskProgress(progressDelta, gameCode)
        const sql = 'update game_risk_control set progress = case when progress_date = ? then progress + ? else ? end, progress_date = ? where game_code = ? and deleted_at is null and (progress_date is null or progress_date <= ?)'
        try {
            const result = await this.select(sql, [progressDate, progressDelta, progressDelta, progressDate, gameCode, progressDate])
            this.progressDateColumnAvailable = true
            return result
        } catch (error) {
            if (!this.isMissingProgressDateColumn(error)) throw error
            this.progressDateColumnAvailable = false
            return this.saveLegacyGlobalGameRiskProgress(progressDelta, gameCode)
        }
    }

    private getLegacyGlobalGameRiskConfig(gameCode: string, progressDate: string) {
        const sql = 'select id, game_code as gameCode, reserve, progress, ? as progressDate, rebate from game_risk_control where game_code = ? and status = 1 and deleted_at is null'
        return this.select(sql, [progressDate, gameCode])
    }

    private saveLegacyGlobalGameRiskProgress(progressDelta: number, gameCode: string) {
        const sql = 'update game_risk_control set progress = progress + ? where game_code = ? and deleted_at is null'
        return this.select(sql, [progressDelta, gameCode])
    }

    private isMissingProgressDateColumn(error: any): boolean {
        if (!error || error.code !== 'ER_BAD_FIELD_ERROR') return false
        return String(error.sqlMessage || error.message || '').includes('progress_date')
    }

    async getControlConfig(channel, gameCode = null) {
        if (gameCode === null || gameCode === undefined) {
            return { results: [] }
        }

        const globalRiskConfig = await this.getGlobalGameRiskConfig(gameCode)
        if (globalRiskConfig.results.length !== 1) {
            return { results: [] }
        }

        const globalRisk = globalRiskConfig.results[0]
        const channelGameMax = await this.getChannelGameMax(channel, globalRisk.gameCode)
        if (channelGameMax.results.length !== 1) {
            return { results: [] }
        }

        return { results: [{ ...globalRisk, gamemax: channelGameMax.results[0].gamemax }] }
    }

    async saveProgress(progressDelta: number, _channel, gameCode = null) {
        if (gameCode === null || gameCode === undefined) {
            return { results: { affectedRows: 0 } }
        }
        return this.saveGlobalGameRiskProgress(progressDelta, gameCode)
    }

    async resetProgressByChannel(_channelId: number) {
        return { results: { affectedRows: 0 } }
    }

    async getWalletType(channelId) {
        const sql = 'SELECT mms_merchant.wallet_type as type from mms_channel right outer join mms_merchant on mms_channel.merchant_id = mms_merchant.id WHERE mms_channel.id = ?'
        return this.select(sql, [channelId])
    }
}
