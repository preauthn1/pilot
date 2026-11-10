import {
    createTcpAcceptor,
    createTcpMailBox,
    FrontendOrBackendSession,
    getLogger,
    HandlerCallback,
    pinus,
    RESERVED,
    RouteRecord
} from 'pinus';
import * as  routeUtil from './app/util/routeUtil';
import { preload } from './preload';

// TODO 需要整理。
import _pinus = require('pinus');
import userService from "./app/services/userService";
import mysqlPool from './app/components/mysqlPool';
import recordService from './app/services/recordService';
import pilotChickenRecordService from './app/services/pilotChickenRecordService';
import './app/util/extensions'
import * as path from 'path'
import controlService from './app/services/controlService';
import gameServerRouteService from './app/services/gameServerRouteService';
import httpServer from './app/components/httpServer';
import uidFilter from './app/filter/uidFilter';

const filePath = (_pinus as any).FILEPATH;
filePath.MASTER = '/config/master';
filePath.SERVER = '/config/servers';
filePath.CRON = '/config/crons';
filePath.LOG = '/config/log4js';
filePath.SERVER_PROTOS = '/config/serverProtos';
filePath.CLIENT_PROTOS = '/config/clientProtos';
filePath.MASTER_HA = '/config/masterha';
filePath.LIFECYCLE = '/lifecycle';
filePath.SERVER_DIR = '/app/servers/';
filePath.CONFIG_DIR = '/config';

const adminfilePath = _pinus.DEFAULT_ADMIN_PATH;
adminfilePath.ADMIN_FILENAME = 'adminUser';
adminfilePath.ADMIN_USER = 'config/adminUser';
/**
 *  替换全局Promise
 *  自动解析sourcemap
 *  捕获全局错误
 */
preload();

/**
 * Init app for client.
 */
let app = pinus.createApp();
app.set('name', 'aviator');
app.set('name1', 'mines');
app.set('name2', 'dice');
app.set('name3', 'pirate');
app.set('name4', 'triple');
app.set('name5', 'jump');
app.set('name6', 'superAce');
app.set('name7', 'clearMines');
app.set('name8', 'tiger');


// app configuration
app.configure('production|development', 'connector', function () {
    app.loadConfig('secret', path.resolve(__dirname + '/config/secret'))
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            heartbeat: 5,
            useDict: true,
            useProtobuf: true,
        });
    // 不自动按照路由生成router,仅使用 config/dictionary 内的路由.
    // 具体看 packages/pinus/lib/components/dictionary.ts DictionaryComponentOptions
    app.set('dictionaryConfig', {
        ignoreAutoRouter: true,
    })

    /**
     // 缓存大小不够 日志示例
     [2020-03-27T10:44:48.752] [ERROR] pinus - [chat-server-1 channelService.js] [pushMessage] fail to dispatch msg to serverId: connector-server-1, err:RangeError [ERR_OUT_OF_RANGE]: The value of "offset" is out of range. It must be >= 0 and <= 0. Received 1
     at boundsError (internal/buffer.js:53:9)
     at writeU_Int8 (internal/buffer.js:562:5)
     at Buffer.writeUInt8 (internal/buffer.js:569:10)
     at Encoder.writeBytes (F:\develop\gong4-server\logicServer\pinus\packages\pinus-protobuf\lib\encoder.ts:195:20)
     */
    app.set('protobufConfig', {
        // protobuf Encoder 使用 5m 的缓存 需要保证每个消息不会超过指定的缓存大小，超过了就会抛出异常
        encoderCacheSize: 5 * 1024 * 1024,
        // decode 对客户端请求消息做校验
        decodeCheckMsg: true,
    });
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('controlService', controlService(app))
    app.set('gameServerRouteService', gameServerRouteService(app))
});
//  游戏
app.configure('production|development', 'aviator', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.loadConfig('setting', path.resolve(__dirname + '/config/setting'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
    app.set('controlService', controlService(app))
})
app.configure('production|development', 'pilotChicken', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.loadConfig('setting', path.resolve(__dirname + '/config/setting'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('pilotChickenRecordService', pilotChickenRecordService(app))
    app.set('controlService', controlService(app))
})
app.configure('production|development', 'clearMines', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.loadConfig('setting', path.resolve(__dirname + '/config/setting'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
    app.set('controlService', controlService(app))
})
app.configure('production|development', 'mines', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.loadConfig('setting', path.resolve(__dirname + '/config/setting'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
    app.set('controlService', controlService(app))
})
app.configure('production|development', 'superAce', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.loadConfig('setting', path.resolve(__dirname + '/config/setting'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
    app.set('controlService', controlService(app))
})
app.configure('production|development', 'dice', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.loadConfig('setting', path.resolve(__dirname + '/config/setting'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
    app.set('controlService', controlService(app))
})

//海盗
app.configure('production|development', 'pirate', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.loadConfig('setting', path.resolve(__dirname + '/config/setting'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
    app.set('controlService', controlService(app))
})
//杀盘老虎
app.configure('production|development', 'tiger', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.loadConfig('setting', path.resolve(__dirname + '/config/setting'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
    app.set('controlService', controlService(app))
})
//跳一跳
app.configure('production|development', 'jump', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.loadConfig('setting', path.resolve(__dirname + '/config/setting'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
    app.set('controlService', controlService(app))
})
//赛车
app.configure('production|development', 'racing', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.loadConfig('setting', path.resolve(__dirname + '/config/setting'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
    app.set('controlService', controlService(app))
})
app.configure('production|development', 'triple', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.loadConfig('setting', path.resolve(__dirname + '/config/setting'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
    app.set('controlService', controlService(app))
})
//  大厅
app.configure('production|development', 'hall', function () {
    app.before(uidFilter())
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
})
//  后台控制
app.configure('production|development', 'control', function () {
    app.loadConfig('secret', path.resolve(__dirname + '/config/secret'))
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            heartbeat: 5,
            useDict: true,
            useProtobuf: true,
            forwardMsg: false               //不走路由
        });
    // 不自动按照路由生成router,仅使用 config/dictionary 内的路由.
    // 具体看 packages/pinus/lib/components/dictionary.ts DictionaryComponentOptions
    app.set('dictionaryConfig', {
        ignoreAutoRouter: true,
    })
    app.loadConfig('mysql', path.resolve(__dirname + '/config/mysql'))
    app.load(mysqlPool, app.get('mysql'))
    app.set('userService', userService(app))
    app.set('recordService', recordService(app))
    app.set('controlService', controlService(app))
    app.set('gameServerRouteService', gameServerRouteService(app))
    app.loadConfig('http', path.resolve(__dirname + '/config/http'))
    app.load(httpServer, Object.assign({ 'logger': getLogger('http-log') }, app.get('http')))
})

function errorHandler(err: Error, msg: any, resp: any,
    session: FrontendOrBackendSession, cb: HandlerCallback) {
    console.error(`${pinus.app.serverId} error handler msg[${JSON.stringify(msg)}] ,resp[${JSON.stringify(resp)}] ,
    to resolve unknown exception: sessionId:${JSON.stringify(session.export())} ,
     error stack: ${err.stack}`);
    if (!resp) {
        resp = { code: 1003 };
    }
    cb(err, resp);
}

export function globalErrorHandler(err: Error, msg: any, resp: any,
    session: FrontendOrBackendSession, cb: HandlerCallback) {
    console.error(`${pinus.app.serverId} globalErrorHandler msg[${JSON.stringify(msg)}] ,resp[${JSON.stringify(resp)}] ,
    to resolve unknown exception: sessionId:${JSON.stringify(session.export())} ,
     error stack: ${err.stack}`);
    if (cb) {
        cb(err, resp ? resp : { code: 503 });
    }
}

// app configure
app.configure('production|development', function () {
    app.set(RESERVED.ERROR_HANDLER, errorHandler);
    app.set(RESERVED.GLOBAL_ERROR_HANDLER, globalErrorHandler);
    app.globalAfter((err: Error, routeRecord: RouteRecord, msg: any, session: FrontendOrBackendSession, resp: any, cb: HandlerCallback) => {
        console.log('全局后置处理', err, routeRecord, msg)
    })

    app.globalBefore((routeRecord: RouteRecord, msg: any, session: FrontendOrBackendSession, cb: HandlerCallback) => {
        if (msg.body === null) {
            cb(new Error(`msg body ===null maybe protobuf check error uid:${session.uid} ${JSON.stringify(msg)}`), { code: 499 });
            return;
        }
        cb(null);
    })

    // route configures
    app.route('aviator', routeUtil.aviator);
    app.route('pilotChicken', routeUtil.pilotChicken);
    app.route('mines', routeUtil.mines);
    app.route('dice', routeUtil.dice);
    // route
    app.route('hall', routeUtil.hall);
    // route
    app.route('racing', routeUtil.racing);

    // route configures
    app.route('pirate', routeUtil.pirate);
    app.route('tiger', routeUtil.tiger);
    app.route('jump', routeUtil.jump);
    app.route('triple', routeUtil.triple);
    app.route('superAce', routeUtil.superAce);
    app.route('clearMines', routeUtil.clearMines);
    
    // filter configures
    app.filter(new pinus.filters.timeout());

    // RPC 启用TCP协议
    app.set('proxyConfig', {
        mailboxFactory: createTcpMailBox,
        // bufferMsg:true
        // rpc 超时时间
        // timeout: 20 * 1000,
        // dynamicUserProxy: true,
    });
    app.set('remoteConfig', {
        acceptorFactory: createTcpAcceptor,
        // bufferMsg:true,
        // interval:50,
    });
});

app.configure('development', function () {
    // enable the system monitor modules
    app.enable('systemMonitor');
});

if (app.isMaster()) {
    //   app.use(createRobotPlugin({scriptFile: __dirname + '/robot/robot.js'}));
}

app.loadConfig('serverTag', path.resolve(__dirname + '/config/serverTag'))
app.load('serverTag', app.get('serverTag'))

// start app
app.start((error?: Error) => {
    if (error) {
        console.error('Pinus application failed to start', error)
        return
    }
    if (app.isMaster() || typeof app.rpcInvoke === 'function') return
    const proxyComponent = app.components.__proxy__
    if (!proxyComponent?.client) {
        console.error('Pinus RPC 代理在服务启动后不可用')
        return
    }
    app.rpcInvoke = proxyComponent.client.rpcInvoke.bind(proxyComponent.client)
});
