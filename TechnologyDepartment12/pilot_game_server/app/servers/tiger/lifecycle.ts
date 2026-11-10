import { Application, ILifeCycle, pinus } from "pinus";
import tiger from "../../games/tiger";
import tigerConfig from "../../games/tiger/tigerConfig";
import tigerControlConfig from "../../games/tiger/tigerControlConfig";

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
       // const _mines = dice(app)
        //关服时剔除所有玩家
        // _mines.forceKickAll().then(() => {
        //     shutDown();
        // })
    }

    afterStartAll(app: Application) {
        console.log(app.curServer.id, 'afterStartAll');
        //tigerControlConfig
        let tag = app.get('serverTag').tiger;
        let task = [tigerConfig(app).loadConfig(tag),tigerControlConfig(app).load(tag)]
        Promise.all(task).then(() => {
            console.log('loading config&control success ----------------tiger')
            tiger(app).run();
            // mines(app).run()
        })
    }
}
