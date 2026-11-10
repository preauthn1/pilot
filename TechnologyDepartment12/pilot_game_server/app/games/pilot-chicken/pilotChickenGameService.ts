import { ChickenCashOutResult, ChickenRevealResult, ChickenRound, ChickenRoundPlacement, ChickenRoundStatus } from './chickenRound'
import { DEFAULT_PILOT_CHICKEN_DIFFICULTY, PilotChickenDifficulty } from './pilotChickenDifficulty'
const PILOT_CHICKEN_ROUND_ID_SEQUENCE_LIMIT = 1_000
let lastPilotChickenRoundTimestampMs = 0
let pilotChickenRoundSequence = 0

export function generatePilotChickenRoundId(): number {
    const currentTimestampMs = Date.now()
    if (currentTimestampMs > lastPilotChickenRoundTimestampMs) {
        lastPilotChickenRoundTimestampMs = currentTimestampMs
        pilotChickenRoundSequence = 0
    } else if (pilotChickenRoundSequence === PILOT_CHICKEN_ROUND_ID_SEQUENCE_LIMIT - 1) {
        lastPilotChickenRoundTimestampMs += 1
        pilotChickenRoundSequence = 0
    } else {
        pilotChickenRoundSequence += 1
    }
    return lastPilotChickenRoundTimestampMs * PILOT_CHICKEN_ROUND_ID_SEQUENCE_LIMIT + pilotChickenRoundSequence
}

export interface FreeBetReservationResult { remainCount: number }
export interface ChickenBetWithFirstRevealResult { snapshot: ChickenRoundSnapshot; reveal: ChickenRevealResult }

export interface ChickenWalletGateway {
    reserveBet(roundId: string, betAmount: number, useFreeBet: boolean): Promise<FreeBetReservationResult | undefined>
    settleRound(roundId: string, payoutAmount: number): Promise<void>
    cancelBet(roundId: string, betAmount: number): Promise<void>
}

export interface ChickenRoundSnapshot {
    status: ChickenRoundStatus | 'IDLE'
    currentCell: number
    multiplierUnits: number
    betAmount: number
    roundId: number | null
    difficulty: PilotChickenDifficulty
    safeMultiplierUnits: readonly number[]
    isFreeBet: boolean
    freeBetCount?: number
    canUseFreeBet?: boolean
    freeBetAmount?: number
}

export interface CompletedChickenRound { roundId: number; betAmount: number; multiplierUnits: number; payoutAmount: number; betTime: Date; finishTime: Date }
interface ActiveChickenRound { roundId: number; round: ChickenRound; difficulty: PilotChickenDifficulty; safeMultiplierUnits: readonly number[]; isFreeBet: boolean; freeBetCount: number; freeBetAmount?: number; betTime: Date; finishTime: Date | null }

export class PilotChickenGameService {
    private readonly roundsByUserId = new Map<number, ActiveChickenRound>()
    private readonly pendingUserIds = new Set<number>()

    public enter(userId: number): ChickenRoundSnapshot { return this.getSnapshot(userId) }

    public async placeBet(userId: number, roundId: number, placement: ChickenRoundPlacement, difficulty: PilotChickenDifficulty, wallet: ChickenWalletGateway, useFreeBet: boolean): Promise<ChickenRoundSnapshot> {
        this.ensureNoPendingOperation(userId)
        if (this.roundsByUserId.get(userId)?.round.status === ChickenRoundStatus.PLAYING) throw new Error('褰撳墠宸叉湁杩涜涓殑鍥炲悎')
        const round = ChickenRound.placeBet(placement)
        this.pendingUserIds.add(userId)
        try {
            const reservationResult = await wallet.reserveBet(String(roundId), placement.betAmount, useFreeBet)
            const freeBetCount = reservationResult?.remainCount ?? 0
            this.roundsByUserId.set(userId, { roundId, round, difficulty, safeMultiplierUnits: [...placement.safeMultiplierUnits], isFreeBet: useFreeBet, freeBetCount, freeBetAmount: useFreeBet ? placement.betAmount : undefined, betTime: new Date(), finishTime: null })
        } finally { this.pendingUserIds.delete(userId) }
        return this.getSnapshot(userId)
    }

    public async placeBetAndRevealFirstCell(userId: number, roundId: number, placement: ChickenRoundPlacement, difficulty: PilotChickenDifficulty, wallet: ChickenWalletGateway, useFreeBet: boolean): Promise<ChickenBetWithFirstRevealResult> {
        await this.placeBet(userId, roundId, placement, difficulty, wallet, useFreeBet)
        const reveal = await this.revealNextCell(userId, 1, wallet)
        return { snapshot: this.getSnapshot(userId), reveal }
    }

    public async revealNextCell(userId: number, cell: number, wallet: ChickenWalletGateway): Promise<ChickenRevealResult> {
        this.ensureNoPendingOperation(userId)
        const activeRound = this.requireRound(userId)
        const preview = activeRound.round.previewNextCell(cell)
        if (preview.status !== ChickenRoundStatus.LOST) return activeRound.round.revealNextCell(cell)
        this.pendingUserIds.add(userId)
        try {
            await wallet.settleRound(String(activeRound.roundId), 0)
            const result = activeRound.round.revealNextCell(cell)
            activeRound.finishTime = new Date()
            return result
        } finally { this.pendingUserIds.delete(userId) }
    }

    public async cashOut(userId: number, wallet: ChickenWalletGateway): Promise<ChickenCashOutResult> {
        this.ensureNoPendingOperation(userId)
        const activeRound = this.requireRound(userId)
        const settlement = activeRound.round.previewCashOut()
        this.pendingUserIds.add(userId)
        try {
            await wallet.settleRound(String(activeRound.roundId), settlement.payoutAmount)
            const result = activeRound.round.cashOut()
            activeRound.finishTime = new Date()
            return result
        } finally { this.pendingUserIds.delete(userId) }
    }

    public getCompletedRound(userId: number): CompletedChickenRound | null {
        const activeRound = this.roundsByUserId.get(userId)
        if (!activeRound || activeRound.round.status === ChickenRoundStatus.PLAYING || !activeRound.finishTime) return null
        const isCashOut = activeRound.round.status === ChickenRoundStatus.CASHED_OUT
        return { roundId: activeRound.roundId, betAmount: activeRound.round.betAmount, multiplierUnits: activeRound.round.crashMultiplierUnits, payoutAmount: isCashOut ? Math.floor(activeRound.round.betAmount * activeRound.round.multiplierUnits / 100) : 0, betTime: activeRound.betTime, finishTime: activeRound.finishTime }
    }

    public async cancelActiveRound(userId: number, wallet: ChickenWalletGateway): Promise<boolean> {
        this.ensureNoPendingOperation(userId)
        const activeRound = this.roundsByUserId.get(userId)
        if (!activeRound || activeRound.round.status !== ChickenRoundStatus.PLAYING) return false
        this.pendingUserIds.add(userId)
        try {
            await wallet.cancelBet(String(activeRound.roundId), activeRound.round.betAmount)
            this.roundsByUserId.delete(userId)
            return true
        } finally { this.pendingUserIds.delete(userId) }
    }

    public getSnapshot(userId: number): ChickenRoundSnapshot {
        const activeRound = this.roundsByUserId.get(userId)
        if (!activeRound) return { status: 'IDLE', currentCell: 0, multiplierUnits: 100, betAmount: 0, roundId: null, difficulty: DEFAULT_PILOT_CHICKEN_DIFFICULTY, safeMultiplierUnits: [], isFreeBet: false }
        const { round } = activeRound
        return { status: round.status, currentCell: round.currentCell, multiplierUnits: round.multiplierUnits, betAmount: round.betAmount, roundId: activeRound.roundId, difficulty: activeRound.difficulty, safeMultiplierUnits: activeRound.safeMultiplierUnits, isFreeBet: activeRound.isFreeBet, freeBetCount: activeRound.freeBetCount, canUseFreeBet: activeRound.freeBetCount > 0, freeBetAmount: activeRound.freeBetAmount }
    }

    private requireRound(userId: number): ActiveChickenRound {
        const activeRound = this.roundsByUserId.get(userId)
        if (!activeRound) throw new Error('round not found')
        return activeRound
    }

    private ensureNoPendingOperation(userId: number): void {
        if (this.pendingUserIds.has(userId)) throw new Error('round operation in progress')
    }
}


const pilotChickenGameService = new PilotChickenGameService()

export default pilotChickenGameService
