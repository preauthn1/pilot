import { Pool } from "mysql2";
import { Application, IComponent } from "pinus";
import * as DataSync from "pomelo-sync"

/**
 * Sync states
 */
 const STATE_STARTED = 1;    // sync has started
 const STATE_STOPED  = 2;    // sync has stoped

export interface Options {
    mappingPath: string
    client: Pool
    interval: number
}

export class Sync implements IComponent {
    name: string = "sync"
    private _app: Application
    private _sync: DataSync
    private _state: number
    constructor(app: Application, opts: Options) {
        this._app = app
        this._sync = new DataSync(opts)
        app.set('sync', this._sync)
    }
    stop(force: boolean, cb: () => void) {
        if(this._state > STATE_STARTED) {
            cb()
            return
        }
        this._state = STATE_STOPED
        this._sync.sync()
        var self = this;
        const interval = setInterval(function(){
            if (self._sync.isDone()) {
              clearInterval(interval);
              cb();
            }
          }, 200);
    }
}