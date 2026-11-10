import { Application } from 'pinus'
import { Dao } from './dao'

export interface GameServerRoute {
    serverType: string
}

export default function (app: Application): GameServerRouteDao {
    return new GameServerRouteDao(app)
}

export class GameServerRouteDao extends Dao {
    public async getEnabledServerTypes(gameCode: string, operationType: string): Promise<{ results: GameServerRoute[] }> {
        const sql = 'select server_type as serverType from game_server_route where game_code = ? and operation_type = ? and status = 1 order by priority asc'
        return await this.select(sql, [gameCode, operationType]) as { results: GameServerRoute[] }
    }
}
