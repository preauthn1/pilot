import { Application } from 'pinus'
import recordDao, { RecordDao } from '../dao/recordDao'

const MAX_PAGE_SIZE = 100

export interface PilotChickenCompletedRound {
    userId: number
    username: string
    channelId: string | number
    gameCode: string
    currency: string
    roundId: number
    betAmount: number
    multiplierUnits: number
    payoutAmount: number
    betTime: Date
    finishTime: Date
}

export interface PilotChickenHistoryRecord {
    gameTime: Date
    betId: number
    cashOutMultiplierUnits: number
    betAmount: number
    payoutAmount: number
    currency: string
}

export interface PilotChickenRecordStore {
    saveCompletedRound(record: PilotChickenCompletedRound): Promise<{ affectedRows: number }>
    findCompletedRounds(userId: number, gameCode: string, offset: number, limit: number): Promise<PilotChickenHistoryRecord[]>
    findRecentMultiplierUnits(channelId: string | number, gameCode: string, limit: number): Promise<number[]>
}

class RecordDaoPilotChickenStore implements PilotChickenRecordStore {
    public constructor(private readonly dao: RecordDao) {}

    public async saveCompletedRound(record: PilotChickenCompletedRound): Promise<{ affectedRows: number }> {
        const response = await this.dao.insertPilotChickenCompletedRound(record)
        return { affectedRows: response.results.affectedRows }
    }

    public async findCompletedRounds(userId: number, gameCode: string, offset: number, limit: number): Promise<PilotChickenHistoryRecord[]> {
        const response = await this.dao.findPilotChickenCompletedRounds(userId, gameCode, offset, limit)
        return response.results
    }

    public async findRecentMultiplierUnits(channelId: string | number, gameCode: string, limit: number): Promise<number[]> {
        const response = await this.dao.findRecentPilotChickenMultiplierUnits(channelId, gameCode, limit)
        return response.results.map((record: { multiplierUnits: number }) => record.multiplierUnits)
    }
}

export default function (app: Application) {
    return new PilotChickenRecordService(new RecordDaoPilotChickenStore(recordDao(app)))
}

export class PilotChickenRecordService {
    private readonly persistedRoundIds = new Set<string>()

    public constructor(private readonly store: PilotChickenRecordStore) {}

    public async saveCompletedRound(record: PilotChickenCompletedRound): Promise<boolean> {
        const roundKey = record.gameCode + ':' + record.roundId
        if (this.persistedRoundIds.has(roundKey)) return false
        const result = await this.store.saveCompletedRound(record)
        if (result.affectedRows !== 1) return false
        this.persistedRoundIds.add(roundKey)
        return true
    }

    public async getRecentMultiplierUnits(channelId: string | number, gameCode: string, limit: number): Promise<number[]> {
        const normalizedLimit = Number.isSafeInteger(limit) && limit > 0 ? Math.min(limit, MAX_PAGE_SIZE) : 20
        return this.store.findRecentMultiplierUnits(channelId, gameCode, normalizedLimit)
    }

    public async getBetHistory(userId: number, gameCode: string, page: number, pageSize: number): Promise<{ records: PilotChickenHistoryRecord[], hasMore: boolean }> {
        const normalizedPage = Number.isSafeInteger(page) && page > 0 ? page : 1
        const normalizedPageSize = Number.isSafeInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, MAX_PAGE_SIZE) : 20
        const offset = (normalizedPage - 1) * normalizedPageSize
        const rows = await this.store.findCompletedRounds(userId, gameCode, offset, normalizedPageSize + 1)
        return { records: rows.slice(0, normalizedPageSize), hasMore: rows.length > normalizedPageSize }
    }
}
