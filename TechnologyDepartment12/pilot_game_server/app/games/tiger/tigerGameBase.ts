import { Application, getLogger, scheduleJob } from "pinus";
import tiger, { Tiger } from ".";
import { ControlService } from "../../services/controlService";
import { bet_danQianBao, settle_danQianBao } from "../../util/HttpsUtil";
import { randomNum } from "../../util/random";
import { delayTime, generateUniqueUuid } from "../../util/time";
import tigerControlConfig, { TigerControlConfig } from "./tigerControlConfig";
import tigerConfig, { TigerConfig } from "./tigerConfig";

export abstract class  TigerGameBase {
    userId: number;
    betCount: number;
    betCut: number;
    roundTimes:number[];

    public _tigerIndex: Tiger;
    public _username:string;
    public _control: { win_threshold: number, lose_threshold: number, win_threshold_percentage: number, lose_threshold_percentage: number }
    public _controlService: ControlService;
    public url: string;
    public channelId: number | string;
    public _walletType: number;
    public merchantId: string
    protected gameCode: string

    constructor(private app: Application, uesrId: number, v: Tiger, username: string, channelId: number | string, walletType: number, merchantId: string, gameCode?: string) {
        this._tigerIndex = v;
        this.merchantId = merchantId;
        this.setGameCode(gameCode);
        this._username = username;
        this.userId = uesrId;
        this._walletType = walletType;
        this._controlService = app.get('controlService')
        this.channelId = channelId;
        this.gameConfig = tigerConfig(app);
        this.gameControlConfig = tigerControlConfig(app);

        /*  */

        this.url = this._tigerIndex.getSeting().url;// 'http://18.143.42.211';
        

    }

    public setGameCode(gameCode: string): void {
        this.gameCode = gameCode
    }

    
    private _isFast : boolean;
    public get isFast() : boolean {
        return this._isFast;
    }
    public set isFast(v : boolean) {
        this._isFast = v;
    }
    

    private _gameConfig: TigerConfig;
    public get gameConfig(): TigerConfig {
        return this._gameConfig;
    }
    public set gameConfig(v: TigerConfig) {
        this._gameConfig = v;
    }

    private _gameControlConfig: TigerControlConfig;
    public get gameControlConfig(): TigerControlConfig {
        return this._gameControlConfig;
    }
    public set gameControlConfig(v: TigerControlConfig) {
        this._gameControlConfig = v;
    }

    private _coin: number;
    public get coin(): number {
        return this._coin;
    }
    public set coin(v: number) {
        this._coin = v;
        this._tigerIndex.updateUserCoin(this.userId, v);
    }

    abstract kick:boolean

    //abstract betAndSettle(channelId: string | number, amount: number, auto:boolean, tag:string,level:number):void;

    abstract setControl(V:any):void;

    abstract stop():void;

    abstract run(count: number, amount: number, channelId, auto: boolean, tag: string,level:number):void;

    /** 开关快速模式 */
    abstract turbo():boolean;

}
