import { Application, ILifeCycle } from "pinus"
import aviator from "../../games/aviator"

export default function () { return new Lifecycle() }

class Lifecycle implements ILifeCycle {
    beforeStartup(app: Application, callback: () => void): void {
        console.log(app.curServer.id, 'beforeStartup')
        callback()
    }

    afterStartup(app: Application, callback: () => void) {
        console.log(app.curServer.id, 'afterStartup')
        callback()
    }

    beforeShutdown(app: Application, shutDown: () => void) {
        aviator(app).forceKickAll().then(shutDown)
    }

    afterStartAll(app: Application) {
        console.log(app.curServer.id, 'afterStartAll')
        aviator(app).run()
    }
}
