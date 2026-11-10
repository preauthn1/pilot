import { Application, ILifeCycle, pinus } from "pinus";
import clearMines from "../../games/clearMines";
import clearMinesConfig from "../../games/clearMines/ClearMinesConfig";
import clearMinesControlConfig from "../../games/clearMines/ClearMinesControlConfig";

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
        let tag = app.get('serverTag').mines;
        let task = [clearMinesConfig(app).loadConfig(tag),clearMinesControlConfig(app).load(tag)]
        Promise.all(task).then(() => {
            console.log('loading config&control success ----------------clearMines')
            clearMines(app).run();
            // mines(app).run()
        })
    }
}
