import * as assert from 'assert'
import { ChickenRoundPlacement, ChickenRoundStatus } from '../app/games/pilot-chicken/chickenRound'
import { ChickenWalletGateway, FreeBetReservationResult, PilotChickenGameService } from '../app/games/pilot-chicken/pilotChickenGameService'

const safeFirstCellPlacement: ChickenRoundPlacement = {
    betAmount: 800,
    mineCells: new Set<number>([2]),
    safeMultiplierUnits: [125, 150, 200],
}

const losingFirstCellPlacement: ChickenRoundPlacement = {
    betAmount: 800,
    mineCells: new Set<number>([1]),
    safeMultiplierUnits: [125, 150, 200],
}

class FakeChickenWallet implements ChickenWalletGateway {
    public settlementAttempts: Array<{ roundId: string; payoutAmount: number }> = []
    public rejectNextSettlement = false

    public async reserveBet(_roundId: string, _betAmount: number, _useFreeBet: boolean): Promise<FreeBetReservationResult | undefined> {
        return undefined
    }

    public async settleRound(roundId: string, payoutAmount: number): Promise<void> {
        this.settlementAttempts.push({ roundId, payoutAmount })
        if (this.rejectNextSettlement) {
            this.rejectNextSettlement = false
            throw new Error('settlement failed')
        }
    }

    public async cancelBet(): Promise<void> {}
}

async function run(): Promise<void> {
    const winningWallet = new FakeChickenWallet()
    const winningService = new PilotChickenGameService()
    await winningService.placeBetAndRevealFirstCell(101, 1001, safeFirstCellPlacement, 'easy', winningWallet, false)
    const cashOut = await winningService.cashOut(101, winningWallet)
    assert.strictEqual(cashOut.payoutAmount, 1000)
    assert.deepStrictEqual(winningWallet.settlementAttempts, [{ roundId: '1001', payoutAmount: 1000 }])

    const losingWallet = new FakeChickenWallet()
    const losingService = new PilotChickenGameService()
    const firstCellLoss = await losingService.placeBetAndRevealFirstCell(102, 1002, losingFirstCellPlacement, 'medium', losingWallet, false)
    assert.strictEqual(firstCellLoss.reveal.status, ChickenRoundStatus.LOST)
    assert.deepStrictEqual(losingWallet.settlementAttempts, [{ roundId: '1002', payoutAmount: 0 }])
    await assert.rejects(() => losingService.revealNextCell(102, 2, losingWallet), /LOST/)
    assert.strictEqual(losingWallet.settlementAttempts.length, 1)

    const retryWallet = new FakeChickenWallet()
    retryWallet.rejectNextSettlement = true
    const retryService = new PilotChickenGameService()
    await retryService.placeBet(103, 1003, losingFirstCellPlacement, 'hard', retryWallet, false)
    await assert.rejects(() => retryService.revealNextCell(103, 1, retryWallet), /settlement failed/)
    assert.strictEqual(retryService.getSnapshot(103).status, ChickenRoundStatus.PLAYING)
    assert.strictEqual(retryService.getSnapshot(103).currentCell, 0)
    const retriedLoss = await retryService.revealNextCell(103, 1, retryWallet)
    assert.strictEqual(retriedLoss.status, ChickenRoundStatus.LOST)
    assert.deepStrictEqual(retryWallet.settlementAttempts, [
        { roundId: '1003', payoutAmount: 0 },
        { roundId: '1003', payoutAmount: 0 },
    ])

    const httpsUtil = require('../app/util/HttpsUtil') as { settle_danQianBao: (...argumentsList: unknown[]) => Promise<unknown> }
    const originalSettle = httpsUtil.settle_danQianBao
    const upstreamSettlementCalls: unknown[][] = []
    httpsUtil.settle_danQianBao = async (...argumentsList: unknown[]) => {
        upstreamSettlementCalls.push(argumentsList)
        return { code: 0 }
    }
    try {
        const { createPilotChickenWallet } = require('../app/servers/pilotChicken/pilotChickenWallet') as typeof import('../app/servers/pilotChicken/pilotChickenWallet')
        const wallet = createPilotChickenWallet({ userId: 104, username: 'player-104', channelId: 12, merchantId: 34, gameCode: 'pilot-chicken' }, { url: 'https://wallet.example/api' })
        await wallet.settleRound('1004', 0)
        assert.deepStrictEqual(upstreamSettlementCalls, [[
            'player-104', '12', '1004', 0, 'https://wallet.example/api', 34, 'pilot-chicken',
        ]])
    } finally {
        httpsUtil.settle_danQianBao = originalSettle
    }

    console.log('pilot chicken settlement tests passed')
}

void run()
