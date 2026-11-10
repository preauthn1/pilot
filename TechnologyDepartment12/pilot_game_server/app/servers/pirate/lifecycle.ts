import { Application, ILifeCycle, pinus } from "pinus";
import pirate from "../../games/pirate";
import pirateConfig from "../../games/pirate/pirateConfig";
import pirateControlConfig from "../../games/pirate/pirateControlConfig";

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
        //pirateControlConfig
        let tag = app.get('serverTag').pirate;
        let task = [pirateConfig(app).loadConfig(tag),pirateControlConfig(app).load(tag)]
        Promise.all(task).then(() => {
            console.log('loading config&control success ----------------pirate')
            pirate(app).run();
            // mines(app).run()
        })
    }
}
