import { Application } from 'pinus';
import { FrontendSession } from 'pinus';
import { Code } from "../../../consts/code";
import { Token } from "../../../util/token";

export default function (app: Application) {
    return new EntryHandler(app);
}

export class EntryHandler {
    private _secret: { key: string, useful: number }
    constructor(private app: Application) {
        this._secret = this.app.get('secret')
    }
    /**
     * New client entry fish server.
     * @param  {Object}   msg     request message
     * @param  {Object}   session current session object
     */
    async entry(msg: { token: string }, session: FrontendSession) {
        if (!msg.token) {
            return { code: Code.ERROR_PARAM }
        }
        const authInfo = Token.parse(msg.token, this._secret.key)
        if (!authInfo) {
            return { code: Code.ERROR_TOKEN }
        }
        if (!Token.check(authInfo, this._secret.useful)) {
            return { code: Code.INVALID_TOKEN }
        }
        const gameCode = authInfo.gameCode
        if (!gameCode) {
            return { code: Code.ERROR_PARAM, data: { msg: 'gameCode is required' } }
        }
        if (!!session.uid) {
            return { code: Code.ERROR_REPEAT }
        }
        const observerId = authInfo.uid


        let aviators = this.app.getServersByType('aviator');
        const sessionService = this.app.get('sessionService')
        // 连接是否还在：先清旧observer再踢旧session，避免removeObserver/addObserver RPC竞态
        if (!!sessionService.getByUid(authInfo.uid)) {
            await this.app.rpc.aviator.remote.removeObserver.toServer(aviators[0].id, observerId, gameCode)
            await sessionService.akick(observerId, 'observerId already has session!!!')
        }
        await session.abind(observerId)
        session.set('gameCode', gameCode)
        session.on('closed', this.onObserverLeave.bind(this))
        if (!await this.app.rpc.aviator.remote.addObserver.toServer(aviators[0].id, parseInt(observerId), gameCode)) {
            return { code: Code.ERROR_STATUS, data: { msg: 'connect server error' } }
        }
        return { code: Code.OK, data: {} }
    }
    /**
     * User log out handler
     *
     * @param {Object} app current application
     * @param {Object} session current session object
     *
     */
    private async onObserverLeave(session: FrontendSession) {
        if (!session || !session.uid) {
            return;
        }
        let aviators = this.app.getServersByType('aviator');
        if (!aviators || aviators.length === 0) {
            return;
        }
        const gameCode = session.get('gameCode') as string
        await this.app.rpc.aviator.remote.removeObserver.toServer(aviators[0].id, parseInt(session.uid), gameCode)
    }
}
