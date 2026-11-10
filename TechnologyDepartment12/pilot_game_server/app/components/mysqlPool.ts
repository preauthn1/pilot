import {IComponent, Application} from "pinus";
import {createPool, Pool, PoolOptions} from "mysql2";
import {getLogger} from "pinus-logger";
const logger = getLogger("PinusMysql")

export default function(app: Application, opts: PoolOptions) {
    return new MysqlPool(app, opts)
}


export class MysqlPool implements IComponent{
    public name:string = "MysqlPool"
    private app: Application
    private options: PoolOptions
    private pool: Pool

    constructor(app: Application, opts: PoolOptions) {
        this.app = app
        this.options = opts
        this.pool = createPool(this.options)
        this.app.set(this.name, this.pool, true)
    }
    public start(cb: () => void) {
        cb()
    }

    public afterStart(cb: () => void) {
        logger.info('mysql afterStart');
        process.nextTick(cb);
    }

    public stop(force: boolean, cb: () => void) {
        this.pool.end((err) => {
            if (!!err) {
                console.log(err)
            }
            console.log('pool stop')
            cb()
        })
    }
}



