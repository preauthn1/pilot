export function normalizeAviatorGameCode(gameCode: unknown): string {
    return typeof gameCode === 'string' ? gameCode.trim().toLowerCase() : ''
}

export function makeAviatorRoomKey(channelId: number, gameCode: unknown): string {
    const normalizedGameCode = normalizeAviatorGameCode(gameCode)
    if (!Number.isFinite(channelId) || channelId <= 0 || !normalizedGameCode) {
        return ''
    }
    return `${channelId}:${normalizedGameCode}`
}
