import { Application } from 'pinus'
import { FrontendSession } from 'pinus'
import { Code, OnlineStatus } from '../../../consts/code'
import { UserService } from '../../../services/userService'
import { GameServerRouteService } from '../../../services/gameServerRouteService'
import { ControlService } from '../../../services/controlService'
import { Token, resolveTrustedGameCode } from '../../../util/token'
import { getLogger } from 'pinus-logger'

const logger = getLogger('entryHandler')

export default function (app: Application) {
    return new EntryHandler(app)
}

export class EntryHandler {
    private readonly userService: UserService
    private readonly routeService: GameServerRouteService
    private readonly controlService: ControlService
    private readonly secret: { key: string, useful: number }

    public constructor(private readonly app: Application) {
        this.userService = this.app.get('userService')
        this.routeService = this.app.get('gameServerRouteService')
        this.controlService = this.app.get('controlService')
        this.secret = this.app.get('secret')
    }

    public async entry(msg: { token: string, gameCode?: string }, session: FrontendSession) {
        if (!msg.token) return { code: Code.ERROR_PARAM }

        const authInfo = Token.parse(msg.token, this.secret.key)
        if (!authInfo) return { code: Code.ERROR_TOKEN }
        if (!Token.check(authInfo, this.secret.useful)) return { code: Code.INVALID_TOKEN }

        const gameCode = resolveTrustedGameCode(authInfo.gameCode, msg.gameCode, authInfo.isLegacy)
        if (!gameCode) return { code: Code.ERROR_TOKEN }
        if (!await this.controlService.isGameEnabled(gameCode)) {
            return { code: Code.ERROR_ENTER_GAME, msg: 'game is disabled' }
        }
        if (session.uid) return { code: Code.ERROR_REPEAT }

        const sessionService = this.app.get('sessionService')
        if (sessionService.getByUid(authInfo.uid)) {
            await sessionService.akick(authInfo.uid, 'uid already has session')
        }

        session.on('closed', this.onUserLeave.bind(this))
        session.set('gameCode', gameCode)
        try {
            await new Promise<void>((resolve, reject) => session.push('gameCode', error => error ? reject(error) : resolve()))
        } catch (error) {
            logger.error('push gameCode to backend session fail', error)
            return { code: Code.ERROR_PARAM }
        }

        await session.abind(authInfo.uid)
        try {
            await this.userService.updateUserOnline(Number(authInfo.uid), OnlineStatus.ONLINE)
        } catch (error) {
            logger.warn('update user online fail', error)
        }
        return { code: Code.OK, data: {} }
    }

    private async onUserLeave(session: FrontendSession): Promise<void> {
        if (!session || !session.uid) return

        const gameCode = session.get('gameCode') as string
        const serverTypes = await this.routeService.getServerTypes(gameCode, 'DISCONNECT')
        if (serverTypes.length === 0) {
            logger.error('disconnect route not found', { gameCode, userId: session.uid })
        }

        for (const serverType of serverTypes) {
            await this.notifyGameOffline(serverType, Number(session.uid), gameCode)
        }

        try {
            await this.userService.updateUserOnline(Number(session.uid), OnlineStatus.OFFLINE)
        } catch (error) {
            logger.warn('update user offline fail', error)
        }
    }

    private async notifyGameOffline(serverType: string, userId: number, gameCode: string): Promise<void> {
        const servers = this.app.getServersByType(serverType)
        if (!servers || servers.length === 0) {
            logger.error('disconnect target server is not running', { serverType, gameCode, userId })
            return
        }

        const rpc = this.app.rpc as any
        switch (serverType) {
            case 'aviator':
                await rpc.aviator.remote.offline.toServer(servers[0].id, userId, gameCode)
                return
            case 'pilotChicken':
                await rpc.pilotChicken.remote.offline.toServer(servers[0].id, userId, gameCode)
                return
            default:
                logger.error('unsupported disconnect server type', { serverType, gameCode, userId })
        }
    }
}
