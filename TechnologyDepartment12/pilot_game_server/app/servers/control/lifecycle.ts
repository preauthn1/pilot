import {Application, ILifeCycle, pinus} from "pinus";
import robot from "../../games/aviator/robot";


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
    }

    async afterStartAll(app: Application) {
        console.log(app.curServer.id, 'afterStartAll');
        if (!await robot(app).init()){
            console.error(app.curServer.id, '小飞机机器人初始化失败');
        }
        let userService = app.get('userService');
        userService.allUserUnlock();
    }
}
