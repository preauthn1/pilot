import { Application, FrontendSession, RemoterClass } from "pinus";
import robot, {Robot} from "../../../games/aviator/robot";
import robot_Car, { Robot_Car } from "../../../games/racing/robot_Car";


export default function(app: Application) {
    return new Remote(app)
}

declare global {
    interface UserRpc {
        control: {
            remote: RemoterClass<FrontendSession, Remote>
        }
    }
}

export class Remote {
    private _robot: Robot;
    private _robot_car:Robot_Car;
    constructor(private app: Application) {
        this._robot = robot(app)
        this._robot_car = robot_Car(app);
       
    }

    public robotBet(times: number, gameCode: string, channel: number|string){
        return this._robot.bet(times, gameCode, channel)
    }

    public robotBet_racing(times: number){
        return this._robot_car.bet(times)
    }

}
