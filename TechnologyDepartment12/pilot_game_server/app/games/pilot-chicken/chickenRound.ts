export const MULTIPLIER_UNIT = 100

export enum ChickenRoundStatus { PLAYING = 'PLAYING', CASHED_OUT = 'CASHED_OUT', LOST = 'LOST' }
export interface ChickenRoundPlacement { betAmount: number; mineCells: ReadonlySet<number>; safeMultiplierUnits: readonly number[] }
export interface ChickenRevealResult { status: ChickenRoundStatus; cell: number; isMine: boolean; multiplierUnits: number }
export interface ChickenCashOutResult { status: ChickenRoundStatus.CASHED_OUT; multiplierUnits: number; payoutAmount: number }

export class ChickenRound {
    public readonly crashMultiplierUnits: number

    private constructor(public readonly betAmount: number, private readonly mineCells: ReadonlySet<number>, private readonly safeMultiplierUnits: readonly number[], public status: ChickenRoundStatus, public currentCell: number, public multiplierUnits: number) {
        const mineCell = [...mineCells][0]
        const crashMultiplierUnits = mineCell === undefined
            ? safeMultiplierUnits[safeMultiplierUnits.length - 1]
            : safeMultiplierUnits[mineCell - 1]
        if (!Number.isSafeInteger(crashMultiplierUnits)) throw new Error('crash multiplier is unavailable')
        this.crashMultiplierUnits = crashMultiplierUnits
    }

    public static placeBet(placement: ChickenRoundPlacement): ChickenRound {
        if (!Number.isSafeInteger(placement.betAmount) || placement.betAmount <= 0) throw new Error('下注金额必须是正整数')
        if (placement.safeMultiplierUnits.length === 0) throw new Error('安全倍数配置不能为空')
        for (const multiplierUnits of placement.safeMultiplierUnits) if (!Number.isSafeInteger(multiplierUnits) || multiplierUnits < MULTIPLIER_UNIT) throw new Error('倍数单位必须是 100 的整数倍')
        return new ChickenRound(placement.betAmount, new Set(placement.mineCells), [...placement.safeMultiplierUnits], ChickenRoundStatus.PLAYING, 0, MULTIPLIER_UNIT)
    }

    public revealNextCell(cell: number): ChickenRevealResult {
        const result = this.previewNextCell(cell)
        this.currentCell = result.cell
        this.status = result.status
        this.multiplierUnits = result.multiplierUnits
        return result
    }

    public previewNextCell(cell: number): ChickenRevealResult {
        this.ensurePlaying()
        const expectedCell = this.currentCell + 1
        if (!Number.isSafeInteger(cell) || cell !== expectedCell) throw new Error(`当前应翻开第 ${expectedCell} 格`)
        if (!this.mineCells.has(cell) && this.safeMultiplierUnits[cell - 1] === undefined) throw new Error('格子不在已配置的风险路径中')
        if (this.mineCells.has(cell)) return { status: ChickenRoundStatus.LOST, cell, isMine: true, multiplierUnits: 0 }
        const multiplierUnits = this.safeMultiplierUnits[cell - 1]
        return { status: ChickenRoundStatus.PLAYING, cell, isMine: false, multiplierUnits }
    }

    public cashOut(): ChickenCashOutResult { const result = this.previewCashOut(); this.status = ChickenRoundStatus.CASHED_OUT; return result }
    public previewCashOut(): ChickenCashOutResult {
        if (this.status !== ChickenRoundStatus.PLAYING) throw new Error('本局已结束，无法提现')
        if (this.currentCell === 0) throw new Error('至少翻开一格后才能提现')
        return { status: ChickenRoundStatus.CASHED_OUT, multiplierUnits: this.multiplierUnits, payoutAmount: this.calculatePayoutAmount() }
    }
    private calculatePayoutAmount(): number { const multipliedAmount = this.betAmount * this.multiplierUnits; if (!Number.isSafeInteger(multipliedAmount)) throw new Error('派彩金额超出安全整数范围'); return Math.floor(multipliedAmount / MULTIPLIER_UNIT) }
    private ensurePlaying(): void { if (this.status !== ChickenRoundStatus.PLAYING) throw new Error(`当前回合状态为 ${this.status}，无法执行操作`) }
}
