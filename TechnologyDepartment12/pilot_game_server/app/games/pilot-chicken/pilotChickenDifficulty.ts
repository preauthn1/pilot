export const DEFAULT_PILOT_CHICKEN_DIFFICULTY = 'medium'

export const PILOT_CHICKEN_DIFFICULTIES = {
    easy: { multiplierUnits: [101, 103, 106, 110, 115, 119, 124, 130, 135, 142, 148, 156, 165, 175, 185, 198, 212, 228, 247, 270, 296, 328, 370, 411, 464, 539, 650, 836, 1208, 2324] },
    medium: { multiplierUnits: [108, 121, 137, 156, 178, 205, 237, 277, 324, 385, 462, 561, 691, 864, 1099, 1429, 1896, 2607, 3724, 5382, 8236, 13759, 26535, 63882, 245700] },
    hard: { multiplierUnits: [118, 146, 183, 231, 295, 382, 502, 666, 904, 1252, 1774, 2580, 3871, 6021, 9734, 16687, 30594, 59586, 128303, 326764, 1089854, 6216209] },
    hardcore: { multiplierUnits: [144, 221, 345, 553, 909, 1530, 2678, 4870, 9254, 18508, 39125, 89428, 223572, 609615, 1896033, 7243275, 37963282, 360885525] },
} as const

export type PilotChickenDifficulty = keyof typeof PILOT_CHICKEN_DIFFICULTIES

export interface PilotChickenDifficultyConfig {
    difficulty: PilotChickenDifficulty
    multiplierUnits: readonly number[]
}

export function resolvePilotChickenTargetRtp(targetKillRate: number): number {
    if (!Number.isInteger(targetKillRate) || targetKillRate < 1 || targetKillRate > 99) throw new Error('杀率必须是 1 到 99 之间的整数')
    return 100 - targetKillRate
}

export function resolvePilotChickenMineCell(multiplierUnits: readonly number[], targetRtp: number, randomValue: number): number | null {
    if (!Number.isInteger(targetRtp) || targetRtp < 1 || targetRtp > 99) throw new Error('RTP 必须是 1 到 99 之间的整数')
    if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) throw new Error('随机值必须在 0 到 1 之间')

    for (let index = 0; index < multiplierUnits.length; index++) {
        const multiplierUnit = multiplierUnits[index]
        if (!Number.isInteger(multiplierUnit) || multiplierUnit <= 0 || (index > 0 && multiplierUnit <= multiplierUnits[index - 1])) {
            throw new Error('倍率必须严格递增')
        }
    }

    let cumulativeProbability = 0
    let previousSurvivalProbability = 1
    for (let index = 0; index < multiplierUnits.length; index++) {
        const multiplierUnit = multiplierUnits[index]
        const survivalProbability = targetRtp / multiplierUnit
        if (survivalProbability > previousSurvivalProbability) throw new Error('目标 RTP 无法由当前倍率表示')
        cumulativeProbability += previousSurvivalProbability - survivalProbability
        if (randomValue < cumulativeProbability) return index + 1
        previousSurvivalProbability = survivalProbability
    }

    return null
}

export function getPilotChickenDifficulty(value: unknown = DEFAULT_PILOT_CHICKEN_DIFFICULTY): PilotChickenDifficultyConfig {
    if (typeof value !== 'string' || !(value in PILOT_CHICKEN_DIFFICULTIES)) throw new Error('Pilot Chicken 难度无效')
    const difficulty = value as PilotChickenDifficulty
    return { difficulty, multiplierUnits: PILOT_CHICKEN_DIFFICULTIES[difficulty].multiplierUnits }
}
