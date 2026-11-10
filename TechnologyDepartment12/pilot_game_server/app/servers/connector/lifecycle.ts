import { Application, ILifeCycle } from 'pinus';
import * as console from "console";
import { UserService } from "../../services/userService";
import { OnlineStatus } from "../../consts/code";
import { ControlService } from '../../services/controlService';

export default function () {
    return new Lifecycle();
}

class Lifecycle implements ILifeCycle {
    beforeStartup(app: Application, cb: () => void): void {
        //console.log(app.getServerId(), '!!!before startup');
        cb();
    }
    afterStartup(app: Application, cb: () => void): void {
        //console.log(app.getServerId(), '!!afterStartup');
        cb();
    }
    afterStartAll(app: Application): void {
        //console.log(app.getServerId(), '!!after start all');
    }

    beforeShutdown(app: Application, shutDown: () => void, cancelShutDownTimer: () => void) {
        //console.log(app.getServerId(), '!!beforeShutdown');

        const sessionService = app.get('sessionService')
        let userService: UserService = app.get("userService")
        let task: Promise<void>[] = []
        sessionService.forEachSession((session) => {
            let f = async (): Promise<void> => {
                console.log('关闭服务器，玩家下线')
                console.log(session.uid, 'beforeShutdown')
                // 玩家下线
                await userService.updateUserOnline(parseInt(session.uid), OnlineStatus.OFFLINE)
                console.log('关闭服务器，玩家下线完成')
            }
            task.push(f())

        })
        Promise.all(task).then(() => {
            shutDown()
        })
    }
}
