import { Application, ILifeCycle, pinus } from "pinus";
import racing from "../../games/racing";
import controlConfig from "../../games/racing/controlConfig";
import gameConfig from "../../games/racing/gameConfig";


export default function () {
    return new Lifecycle();
}

class Lifecycle implements ILifeCycle {
    beforeStartup(app: Application, cb: () => void): void {
        console.log(app.curServer.id, 'beforeStartup');
        cb();
    }
    afterStartup(app: Application, cb: () => void) {
        // do some operations after application start up
        console.log(app.curServer.id, 'afterStartup');
        cb();
    }

    beforeShutdown(app: Application, shutDown: () => void, cancelShutDownTimer: () => void) {
        //console.log(app.getServerId(), '!!beforeShutdown');
        const _aviator = racing(app)
        _aviator.forceKickAll().then(() => {
            shutDown();
        })
    }

    afterStartAll(app: Application) {
        console.log(app.curServer.id, 'afterStartAll');
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>loading config&control<<<<<<<<<<<<<<<<<')
        let GameTag = app.get('serverTag').racing
        let task = [gameConfig(app).load(GameTag), controlConfig(app).load(GameTag)]
        Promise.all(task)
        .catch(e =>{
            console.log("加载赛车配置错误:",e)
        })
        .then(() => {
            console.log('loading config&control success -----------racing')
            racing(app).run();
        })
    }
}

