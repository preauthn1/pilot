import { Application, ILifeCycle, pinus } from "pinus";
import mines from "../../games/mines";
import controlConfig from "../../games/mines/controlConfig";
import gameConfig from "../../games/mines/gameConfig";


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
        const _mines = mines(app)
        //关服时剔除所有玩家
        // _mines.forceKickAll().then(() => {
        //     shutDown();
        // })
    }

    afterStartAll(app: Application) {
        console.log(app.curServer.id, 'afterStartAll');
        console.log('loading config&control')

        let GameTag = app.get('serverTag').mines
        let task = [gameConfig(app).load(GameTag), controlConfig(app).load(GameTag)]
        Promise.all(task).then(() => {
            console.log('loading config&control success')
            console.log("------扫雷启动------");
            //小飞机游戏逻辑开始，这里扫雷不需要
            // mines(app).run()
        })
    }
}
