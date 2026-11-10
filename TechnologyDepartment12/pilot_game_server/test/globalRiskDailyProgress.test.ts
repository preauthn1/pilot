import * as assert from 'assert'
import { ControlDao } from '../app/dao/controlDao'
import { systemDateString } from '../app/util/time'

type QueryCall = {
    params: unknown[]
    sql: string
}

function createControlDao(select: (sql: string, params: unknown[]) => Promise<unknown>): ControlDao {
    const dao = Object.create(ControlDao.prototype) as any
    dao.select = select
    return dao as ControlDao
}

async function run(): Promise<void> {
    const endOfDay = new Date(2026, 8, 14, 23, 59, 59).getTime()
    const startOfNextDay = new Date(2026, 8, 15, 0, 0, 0).getTime()
    assert.strictEqual(systemDateString(endOfDay), '2026-09-14')
    assert.strictEqual(systemDateString(startOfNextDay), '2026-09-15')

    const readCalls: QueryCall[] = []
    const readDao = createControlDao(async (sql, params) => {
        readCalls.push({ sql, params })
        return { results: [{ gameCode: 'aviator', progress: 0, progressDate: '2026-09-15' }] }
    })
    await readDao.getGlobalGameRiskConfig('aviator', '2026-09-15')
    assert.strictEqual(readCalls.length, 1)
    assert.match(readCalls[0].sql, /case when progress_date = \? then progress else 0 end/)
    assert.deepStrictEqual(readCalls[0].params, ['2026-09-15', '2026-09-15', 'aviator'])

    const writeCalls: QueryCall[] = []
    const writeDao = createControlDao(async (sql, params) => {
        writeCalls.push({ sql, params })
        return { results: { affectedRows: 1 } }
    })
    await writeDao.saveGlobalGameRiskProgress(250, 'aviator', '2026-09-15')
    assert.strictEqual(writeCalls.length, 1)
    assert.match(writeCalls[0].sql, /progress_date is null or progress_date <= \?/)
    assert.deepStrictEqual(writeCalls[0].params, ['2026-09-15', 250, 250, '2026-09-15', 'aviator', '2026-09-15'])

    const fallbackCalls: QueryCall[] = []
    const fallbackDao = createControlDao(async (sql, params) => {
        fallbackCalls.push({ sql, params })
        if (fallbackCalls.length === 1) {
            throw { code: 'ER_BAD_FIELD_ERROR', sqlMessage: 'Unknown column progress_date' }
        }
        return { results: [{ gameCode: 'aviator', progress: 100, progressDate: '2026-09-15' }] }
    })
    await fallbackDao.getGlobalGameRiskConfig('aviator', '2026-09-15')
    assert.strictEqual(fallbackCalls.length, 2)
    assert.doesNotMatch(fallbackCalls[1].sql, /case when progress_date/)
    assert.deepStrictEqual(fallbackCalls[1].params, ['2026-09-15', 'aviator'])

    console.log('global risk daily progress tests passed')
}

void run()
