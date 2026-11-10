import * as express from "express"
import { Request, Response } from "express"
import { Application, getLogger } from "pinus";
import { Code } from "../../../consts/code";
import { BackendSession } from "pinus/lib/index";
import * as crypto from "crypto";
import { forEach } from "pinus-robot/lib/common/util";
const logger = getLogger("http-log")

module.exports = function (app: Application, http: express.Application) {
    const key = app.get('http').key


    const getServerOnThis = function (tag: string): { server, romote } {
        /* 
            'aviator': '1',
            'mines': '2',
            'racing': '3',
            'pirate': '4',
            'dice': '5',
            'triple': '6',
            'superAce':'8'
        */

        switch (tag) {
            case "1":
                return { server: app.getServersByType('aviator'), romote: app.rpc.aviator.remote };
            case "2":
                return { server: app.getServersByType('mines'), romote: app.rpc.mines.remote };
            case "3":
                return { server: app.getServersByType('racing'), romote: app.rpc.racing.remote };
            case "4":
                return { server: app.getServersByType('pirate'), romote: app.rpc.pirate.remote };
            case "5":
                return { server: app.getServersByType('dice'), romote: app.rpc.dice.remote };
            case "6":
                return { server: app.getServersByType('triple'), romote: app.rpc.triple.remote };
            case "8":
                return { server: app.getServersByType('superAce'), romote: app.rpc.superAce.remote };
            default:
                return null;
        }
    }
    /*
    *   踢玩家下线
    */
    http.post('/control/game-risk', async (request: Request, response: Response) => {
        const gameCode = typeof request.body.gameCode === 'string' ? request.body.gameCode.trim().toLowerCase() : ''
        const timestamp = request.body.timestamp
        const sign = request.body.sign
        if (!gameCode || !timestamp || !sign) {
            return response.end(JSON.stringify({ code: Code.ERROR_PARAM }))
        }

        const signStr = 'timestamp=' + timestamp + '&key=' + key
        if (sign !== crypto.createHash('md5').update(signStr).digest('hex')) {
            return response.end(JSON.stringify({ code: Code.INVALID_TOKEN }))
        }

        app.get('controlService').clearGlobalGameRiskCache(gameCode)
        const serverTypes = await app.get('gameServerRouteService').getServerTypes(gameCode, 'RISK_RELOAD')
        if (serverTypes.includes('pilotChicken')) {
            const pilotChickenServers = app.getServersByType('pilotChicken')
            if (!pilotChickenServers || !pilotChickenServers[0]) {
                return response.end(JSON.stringify({ code: Code.ERROR_STATUS, msg: 'pilotChicken server not running' }))
            }
            await app.rpc.pilotChicken.remote.reloadRiskControl.toServer(pilotChickenServers[0].id, gameCode)
        }
        return response.end(JSON.stringify({ code: Code.OK, gameCode }))
    })

    http.post('/control/kick', async (request: Request, response: Response) => {
        let sign = request.body.sign
        let timestamp = request.body.timestamp
        let userId = request.body.userId
        if (!sign || !timestamp || !userId) {
            return response.end(JSON.stringify({ code: Code.ERROR_PARAM }))
        }
        // 验签
        let signStr = 'timestamp=' + timestamp + '&userId=' + userId + '&key=' + key
        if (sign !== crypto.createHash('md5').update(signStr).digest('hex')) {
            return response.end(JSON.stringify({ code: Code.INVALID_TOKEN }))
        }
        const connector = app.getServersByType('connector')
        let backendSessionService = app.backendSessionService
        let sessions: BackendSession[] = await backendSessionService.agetByUid(connector[0].id, userId.toString())
        // 玩家不在线
        if (!sessions || sessions.length !== 1) {
            return response.end(JSON.stringify({ code: Code.USER_NOT_ONLINE }))
        }
        await backendSessionService.akickByUid(connector[0].id, userId) 
        return response.end(JSON.stringify({ code: Code.OK }))
    })

    /*
    * 停止游戏
    */
    http.post('/control/stopGame', async (request: Request, response: Response) => {
        console.log('/game/controlSetting:', request.body);
        let sign = request.body.sign
        let timestamp = request.body.timestamp
        if (!sign || !timestamp) {
            return response.end(JSON.stringify({ code: Code.ERROR_PARAM }))
        }
        // 验签
        let signStr = 'timestamp=' + timestamp + '&key=' + key
        if (sign !== crypto.createHash('md5').update(signStr).digest('hex')) {
            return response.end(JSON.stringify({ code: Code.INVALID_TOKEN }))
        }
        let obj = getServerOnThis(request.body.tag);

        if (!obj) {
            return response.end(JSON.stringify({ code: 101, msg: '无效tag' }))
        }

        //let gameName = getGameNameByTag(request.body.tag)
        //const aviatorServers = app.getServersByType("aviator");
        const aviatorServers = obj.server;
        const remote = obj.romote;
        if (!aviatorServers || !aviatorServers[0]) {
            return response.end(JSON.stringify({ code: 101, msg: 'game server not running', tag: request.body.tag }))
        }


        // 停止游戏
        // await app.rpc.aviator.remote.stopGame.toServer(aviatorServers[0].id)
        await remote.stopGame.toServer(aviatorServers[0].id)
        return response.end(JSON.stringify({ code: Code.OK, tag: request.body.tag }))
        //return response.end(JSON.stringify({ code: Code.OK, tag: 4 }))
    })

    /*
    * 踢出所有玩家
    */
    http.post('/control/kickAll', async (request: Request, response: Response) => {
        let sign = request.body.sign
        let timestamp = request.body.timestamp
        const gameCode = typeof request.body.gameCode === 'string' ? request.body.gameCode.trim().toLowerCase() : ''
        if (!sign || !timestamp || (String(request.body.tag) === '1' && !gameCode)) {
            return response.end(JSON.stringify({ code: Code.ERROR_PARAM }))
        }
        // 验签
        let signStr = 'timestamp=' + timestamp + '&key=' + key
        if (sign !== crypto.createHash('md5').update(signStr).digest('hex')) {
            return response.end(JSON.stringify({ code: Code.INVALID_TOKEN }))
        }
        //const aviatorServers = app.getServersByType('aviator')

        let obj = getServerOnThis(request.body.tag);

        if (!obj) {
            return response.end(JSON.stringify({ code: 101, msg: '无效tag' }))
        }

        //let gameName = getGameNameByTag(request.body.tag)
        //const aviatorServers = app.getServersByType("aviator");
        const aviatorServers = obj.server;
        const remote = obj.romote;
        if (!aviatorServers || !aviatorServers[0]) {
            return response.end(JSON.stringify({ code: 101, msg: 'game server not running', tag: request.body.tag }))
        }

        // 踢出所有玩家
        // await app.rpc.aviator.remote.kickAll.toServer(aviatorServers[0].id)
        if (String(request.body.tag) === '1') {
            await remote.kickAll.toServer(aviatorServers[0].id, gameCode)
        } else {
            await remote.kickAll.toServer(aviatorServers[0].id)
        }
        return response.end(JSON.stringify({ code: Code.OK, tag: request.body.tag }))
    })

    /*
    * 后台结算
    */
    http.post('/control/cashOut', async (request: Request, response: Response) => {
        let sign = request.body.sign
        let timestamp = request.body.timestamp
        let roundId = request.body.roundId
        let operatorId = request.body.operatorId
        const gameCode = typeof request.body.gameCode === 'string' ? request.body.gameCode.trim().toLowerCase() : ''
        if (!sign || !timestamp || !roundId || !operatorId || !gameCode) {
            return response.end(JSON.stringify({ code: Code.ERROR_PARAM }))
        }
        // 验签
        let signStr = 'gameCode=' + gameCode + '&operatorId=' + operatorId + '&roundId=' + roundId + '&timestamp=' + timestamp + '&key=' + key
        if (sign !== crypto.createHash('md5').update(signStr).digest('hex')) {
            return response.end(JSON.stringify({ code: Code.INVALID_TOKEN }))
        }
        const aviatorServers = app.getServersByType('aviator')
        // 强制结算
        const result = await app.rpc.aviator.remote.forceEnd.toServer(aviatorServers[0].id, roundId, parseInt(operatorId), gameCode)
        return response.end(JSON.stringify({ code: result }))
    })

    /*
    * 给用户上分
    */
    http.post('/control/addCoin', async (request: Request, response: Response) => {


        const sign = request.body.sign
        const timestamp = request.body.timestamp
        const userId = request.body.userId
        const addCoin = request.body.addCoin
        const gameCode = typeof request.body.gameCode === 'string' ? request.body.gameCode.trim().toLowerCase() : ''
        if (!userId || !sign || !timestamp || !addCoin || !gameCode) {
            return response.end(JSON.stringify({ code: Code.ERROR_PARAM }))
        }
        console.log("用户上分:", userId, addCoin);
        // 验签
        const signStr = 'userId=' + userId + '&addCoin=' + addCoin + '&timestamp=' + timestamp + '&key=' + key
        if (sign !== crypto.createHash('md5').update(signStr).digest('hex')) {
            return response.end(JSON.stringify({ code: Code.INVALID_TOKEN }))
        }

        let afilter = await app.rpc.aviator.remote.filterUser(userId, gameCode);
        if (afilter)
            app.rpc.aviator.remote.increaseCoin.toServer(app.getServersByType('aviator')[0].id, parseInt(userId), parseInt(addCoin), gameCode)

        let mfilter = await app.rpc.mines.remote.filterUser(userId);
        if (mfilter)
            app.rpc.mines.remote.increaseCoin.toServer(app.getServersByType('mines')[0].id, parseInt(userId), parseInt(addCoin))


        let rfilter = await app.rpc.racing.remote.filterUser(userId);
        if (rfilter)
            app.rpc.racing.remote.increaseCoin.toServer(app.getServersByType('racing')[0].id, parseInt(userId), parseInt(addCoin))

        let pfilter = await app.rpc.pirate.remote.filterUser(userId);
        if (pfilter)
            app.rpc.pirate.remote.increaseCoin.toServer(app.getServersByType('pirate')[0].id, parseInt(userId), parseInt(addCoin))

        const diceServers = app.getServersByType('dice');
        if (diceServers && diceServers[0]) {
            let dfilter = await app.rpc.dice.remote.filterUser(userId);
            if (dfilter)
                app.rpc.dice.remote.increaseCoin.toServer(diceServers[0].id, parseInt(userId), parseInt(addCoin))
        }


        let tfilter = await app.rpc.triple.remote.filterUser(userId);
        if (tfilter)
            app.rpc.triple.remote.increaseCoin.toServer(app.getServersByType('triple')[0].id, parseInt(userId), parseInt(addCoin))


        let acefilter = await app.rpc.superAce.remote.filterUser(userId);
        if (acefilter)
            app.rpc.superAce.remote.increaseCoin.toServer(app.getServersByType('superAce')[0].id, parseInt(userId), parseInt(addCoin))

        // const games = [
        //     app.getServersByType('aviator'),
        //     app.getServersByType('mines'),
        //     app.getServersByType('racing'),
        //     app.getServersByType('pirate'),
        //     app.getServersByType('dice'),
        //     app.getServersByType('triple')
        // ];

        // const aviatorServers = app.getServersByType('aviator')
        // const result = await app.rpc.aviator.remote.increaseCoin.toServer(aviatorServers[0].id, parseInt(userId), parseInt(addCoin))
        return response.end(JSON.stringify({ code: 0 }))
    })

    /*
    * 给用户下分
    */
    http.post('/control/decreaseCoin', async (request: Request, response: Response) => {
        const sign = request.body.sign
        const timestamp = request.body.timestamp
        const userId = request.body.userId
        const coin = request.body.coin
        const gameCode = typeof request.body.gameCode === 'string' ? request.body.gameCode.trim().toLowerCase() : ''
        if (!userId || !sign || !timestamp || !coin || !gameCode) {
            return response.end(JSON.stringify({ code: Code.ERROR_PARAM }))
        }
        // 验签
        const signStr = 'userId=' + userId + '&coin=' + coin + '&timestamp=' + timestamp + '&key=' + key
        if (sign !== crypto.createHash('md5').update(signStr).digest('hex')) {
            return response.end(JSON.stringify({ code: Code.INVALID_TOKEN }))
        }

        let afilter = await app.rpc.aviator.remote.filterUser(userId, gameCode);
        if (afilter)
            app.rpc.aviator.remote.decreaseCoin.toServer(app.getServersByType('aviator')[0].id, parseInt(userId), parseInt(coin), gameCode)

        let mfilter = await app.rpc.mines.remote.filterUser(userId);
        if (mfilter)
            app.rpc.mines.remote.decreaseCoin.toServer(app.getServersByType('mines')[0].id, parseInt(userId), parseInt(coin))


        let rfilter = await app.rpc.racing.remote.filterUser(userId);
        if (rfilter)
            app.rpc.racing.remote.decreaseCoin.toServer(app.getServersByType('racing')[0].id, parseInt(userId), parseInt(coin))

        let pfilter = await app.rpc.pirate.remote.filterUser(userId);
        if (pfilter)
            app.rpc.pirate.remote.decreaseCoin.toServer(app.getServersByType('pirate')[0].id, parseInt(userId), parseInt(coin))

        const diceServers = app.getServersByType('dice');
        if (diceServers && diceServers[0]) {
            let dfilter = await app.rpc.dice.remote.filterUser(userId);
            if (dfilter)
                app.rpc.dice.remote.decreaseCoin.toServer(diceServers[0].id, parseInt(userId), parseInt(coin))
        }


        let tfilter = await app.rpc.triple.remote.filterUser(userId);
        if (tfilter)
            app.rpc.triple.remote.decreaseCoin.toServer(app.getServersByType('triple')[0].id, parseInt(userId), parseInt(coin))

            let acefilter = await app.rpc.superAce.remote.filterUser(userId);
            if (acefilter)
                app.rpc.superAce.remote.decreaseCoin.toServer(app.getServersByType('superAce')[0].id, parseInt(userId), parseInt(coin))

        // const aviatorServers = app.getServersByType('aviator')
        // const result = await app.rpc.aviator.remote.decreaseCoin.toServer(aviatorServers[0].id, parseInt(userId), parseInt(coin))
        return response.end(JSON.stringify({ code: 0 }))
    })
}


