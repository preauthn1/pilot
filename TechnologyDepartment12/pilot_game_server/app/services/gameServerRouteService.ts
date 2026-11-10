import { Application } from 'pinus'
import gameServerRouteDao, { GameServerRouteDao } from '../dao/gameServerRouteDao'

export type GameServerRouteOperation = 'DISCONNECT' | 'CONTROL_RELOAD' | 'RISK_RELOAD'

export default function (app: Application): GameServerRouteService {
    return new GameServerRouteService(app)
}

export class GameServerRouteService {
    private readonly routeDao: GameServerRouteDao

    public constructor(app: Application) {
        this.routeDao = gameServerRouteDao(app)
    }

    public async getServerTypes(gameCode: string, operationType: GameServerRouteOperation): Promise<string[]> {
        const normalizedGameCode = this.normalizeGameCode(gameCode)
        if (!normalizedGameCode) {
            return []
        }

        const routes = await this.routeDao.getEnabledServerTypes(normalizedGameCode, operationType)
        return routes.results
            .map(route => route.serverType)
            .filter(serverType => serverType === 'aviator' || serverType === 'pilotChicken')
    }

    private normalizeGameCode(gameCode: string): string {
        return typeof gameCode === 'string' ? gameCode.trim().toLowerCase() : ''
    }
}
