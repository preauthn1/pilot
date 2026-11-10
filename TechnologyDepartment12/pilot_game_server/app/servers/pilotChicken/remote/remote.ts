import { Application, FrontendSession, RemoterClass } from 'pinus'
import { getPilotChickenHandler, PilotChickenHandler } from '../handler/pilotChickenHandler'

export default function (app: Application) { return new Remote(app) }

declare global {
    interface UserRpc {
        pilotChicken: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private readonly handler: PilotChickenHandler

    public constructor(app: Application) {
        this.handler = getPilotChickenHandler(app)
    }

    public async offline(userId: number, gameCode: string): Promise<void> {
        await this.handler.offline(userId, gameCode)
    }

    public async reloadRiskControl(gameCode: string): Promise<void> {
        await this.handler.reloadRiskControl(gameCode)
    }
}
