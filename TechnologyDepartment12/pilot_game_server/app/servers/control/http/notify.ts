import express = require("express");
import { Request, Response } from "express"
import { Application } from "pinus";
import { Code } from "../../../consts/code";
import * as crypto from "crypto";
import robot from "../../../games/aviator/robot";
import robot_Car from "../../../games/racing/robot_Car";



module.exports = function (app: Application, http: express.Application) {
    const key = app.get('http').key
    //机器人配置
    http.post('/robot/config', async (request: Request, response: Response) => {
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
        let tag = parseInt(request.body.tag.toString());
        let channel = request.body.channel
        const gameCode = typeof request.body.gameCode === 'string' && request.body.gameCode.trim() ? request.body.gameCode.trim().toLowerCase() : 'aviator'
        switch (tag) {
            case 1:
                if (!await robot(app).resetRobot(channel, gameCode)) {
                    console.log('重置配置失败');
                    return response.end(JSON.stringify({ code: Code.ERROR_STATUS, tag: tag }))
                }
                break;
            case 2:

            case 3:
                if (!robot_Car(app).resetRobot(channel)) {
                    console.log('重置配置失败');
                    return response.end(JSON.stringify({ code: Code.ERROR_STATUS, tag: tag }))
                }
                break;
            case 4:
                break;
            case 5:
                break;
            case 6:
                break;
        }


        return response.end(JSON.stringify({ code: Code.OK, tag: tag }))
    })

    http.post('/game/config', async (request: Request, response: Response) => {
        const gameCode = typeof request.body.gameCode === 'string' ? request.body.gameCode.trim().toLowerCase() : ''
        const channel = request.body.channel
        const timestamp = request.body.timestamp
        const sign = request.body.sign
        if (!gameCode || !channel || !timestamp || !sign) return response.end(JSON.stringify({ code: Code.ERROR_PARAM }))
        if (sign !== crypto.createHash('md5').update('timestamp=' + timestamp + '&key=' + key).digest('hex')) return response.end(JSON.stringify({ code: Code.INVALID_TOKEN }))
        const serverTypes = await app.get('gameServerRouteService').getServerTypes(gameCode, 'CONTROL_RELOAD')
        if (serverTypes.length !== 1 || serverTypes[0] !== 'aviator') return response.end(JSON.stringify({ code: Code.ERROR_PARAM, msg: 'unsupported game config reload' }))
        if (!await robot(app).resetGame(channel, gameCode)) return response.end(JSON.stringify({ code: Code.ERROR_STATUS }))
        const servers = app.getServersByType('aviator')
        if (!servers || !servers[0]) return response.end(JSON.stringify({ code: Code.ERROR_STATUS, msg: 'aviator server not running' }))
        await app.rpc.aviator.remote.reload.toServer(servers[0].id, channel, gameCode)
        await app.rpc.aviator.remote.sendToClient.toServer(servers[0].id, gameCode)
        return response.end(JSON.stringify({ code: Code.OK, gameCode }))
    })

    http.post('/control/config', async (request: Request, response: Response) => {
        const gameCode = typeof request.body.gameCode === 'string' ? request.body.gameCode.trim().toLowerCase() : ''
        const channel = request.body.channel
        const timestamp = request.body.timestamp
        const sign = request.body.sign
        if (!gameCode || !channel || !timestamp || !sign) return response.end(JSON.stringify({ code: Code.ERROR_PARAM }))
        if (sign !== crypto.createHash('md5').update('timestamp=' + timestamp + '&key=' + key).digest('hex')) return response.end(JSON.stringify({ code: Code.INVALID_TOKEN }))
        const serverTypes = await app.get('gameServerRouteService').getServerTypes(gameCode, 'RISK_RELOAD')
        if (serverTypes.length !== 1 || serverTypes[0] !== 'aviator') return response.end(JSON.stringify({ code: Code.ERROR_PARAM, msg: 'unsupported risk config reload' }))
        const servers = app.getServersByType('aviator')
        if (!servers || !servers[0]) return response.end(JSON.stringify({ code: Code.ERROR_STATUS, msg: 'aviator server not running' }))
        await app.rpc.aviator.remote.reloadControl.toServer(servers[0].id, channel, gameCode)
        return response.end(JSON.stringify({ code: Code.OK, gameCode }))
    })

}
