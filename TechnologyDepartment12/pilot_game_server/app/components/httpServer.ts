import {Application, getLogger, Logger} from "pinus";
import {IComponent} from "pinus";
import * as express from "express"
import * as http from "http"
import * as https from "https"
import * as path from "path"
import * as fs from "fs"
import { connectLogger } from "log4js";
const assert = require('assert');
const methodOverride = require('method-override');
const errorhandler = require('errorhandler')
const cors = require("cors")

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3001;

export interface Options {
    host?: string,
    port?: number,
    useSSL?: boolean,
    keyFile?: string,
    certFile?: string,
    beforeFilters?:[],
    afterFilters?: [], 
    logger?: Logger
}

export default function(app: Application, opts: Options) {
    return new HttpServer(app, opts)
}
export class HttpServer implements IComponent{
    public name:string = "PinusHttp"
    private _http: express.Application;
    private _app: Application;
    private _host: string;
    private _port: number;
    private _useSSL: boolean;
    private _sslOpts: { key: Buffer, cert: Buffer};
    private beforeFilters: Function[];
    private afterFilters: Function[];
    private logger: Logger;
    private _server: https.Server | http.Server;

    constructor(app: Application, opts: Options) {
        opts = opts || {};
        this._app = app;
        this._http = express();
        this._host = opts.host || DEFAULT_HOST;
        this._port = opts.port || DEFAULT_PORT;
        this._useSSL = !!opts.useSSL;
        if (this._useSSL) {
            this._sslOpts = {
                key : fs.readFileSync(path.join(app.getBase(), opts.keyFile)),
                cert: fs.readFileSync(path.join(app.getBase(), opts.certFile))
            }
        }

        this.logger = opts.logger

        this._http.set('port', this._port);
        this._http.set('host', this._host);
        this._http.use(connectLogger(this.logger, {}));
        this._http.use(express.urlencoded({ extended: true }));
        this._http.use(express.json());
        this._http.use(methodOverride());
        this._http.use(express.Router());
        this._http.use(cors())

        var self = this;
        this._app.configure(function () {
            self._http.use(errorhandler());
        });

        this.beforeFilters = opts.beforeFilters || [];
        this.afterFilters = opts.afterFilters || [];
        this._server = null;
    }
    public loadRoutes() {
        this._http.get('/', function (req: any, res: any) {
            res.send('pinus-http-plugin ok!');
        });

        const routesPath = path.join(this._app.getBase(), 'app/servers', this._app.getServerType(), 'http');
        // self.logger.info(routesPath);
        assert.ok(fs.existsSync(routesPath), 'Cannot find route path: ' + routesPath);

        const self = this;
        fs.readdirSync(routesPath).forEach(function (file: any) {
            if (/.js$/.test(file)) {
                const routePath = path.join(routesPath, file);
                require(routePath)(self._app, self._http, self);
            }
        });
    }

    public start(cb: any) {
        this.beforeFilters.forEach((elem: any) =>{
            this._http.use(elem);
        });

        this.loadRoutes();

        this.afterFilters.forEach((elem: any) => {
            this._http.use(elem);
        });

        if (this._useSSL) {
            this._server = https.createServer(this._sslOpts, this._http).listen(this._port, this._host,  () => {
                this.logger.info('Http start', this._app.getServerId(), 'url: https://' + this._host + ':' + this._port);
                this.logger.info('Http start success');
                process.nextTick(cb);
            });
        } else {
            this._server = http.createServer(this._http).listen(this._port, this._host, () => {
                this.logger.info('Http start', this._app.getServerId(), 'url: http://' + this._host + ':' + this._port);
                this.logger.info('Http start success');
                process.nextTick(cb);
            });
        }
    }

    public afterStart(cb: any) {
        this.logger.info('Http afterStart');
        process.nextTick(cb);
    }

    public stop(force: any, cb: any) {
        this._server.close(() => {
            this.logger.info('Http stop');
            cb();
        })
    }
}



