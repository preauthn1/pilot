import { Application, getLogger, scheduleJob } from "pinus";
import pirate, { Pirate } from ".";
import { ControlService } from "../../services/controlService";
import { bet_danQianBao, settle_danQianBao } from "../../util/HttpsUtil";
import { randomNum } from "../../util/random";
import { delayTime, generateUniqueUuid } from "../../util/time";
import Line from "./Line";
import pirateControlConfig, { PirateControlConfig } from "./pirateControlConfig";
import pirateConfig, { PirateConfig } from "./pirateConfig";

export abstract class  PirateGameBase {
    userId: number;
    betCount: number;
    betCut: number;
    roundTimes:number[];

    public _pirateIndex: Pirate;
    public _username:string;
    public _control: { win_threshold: number, lose_threshold: number, win_threshold_percentage: number, lose_threshold_percentage: number }
    public _controlService: ControlService;
    public url: string;
    public channelId: number | string;
    public _walletType: number;
    public merchantId: string
    protected gameCode: string

    constructor(private app: Application, uesrId: number, v: Pirate, username: string, channelId: number | string, walletType: number, merchantId: string, gameCode?: string) {
        this._pirateIndex = v;
        this.merchantId = merchantId;
        this.setGameCode(gameCode);
        this._username = username;
        this.userId = uesrId;
        this._walletType = walletType;
        this._controlService = app.get('controlService')
        this.channelId = channelId;
        this.gameConfig = pirateConfig(app);
        this.gameControlConfig = pirateControlConfig(app);

        /*  */

        this.url = this._pirateIndex.getSeting().url;// 'http://18.143.42.211';
        

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
    

    private _gameConfig: PirateConfig;
    public get gameConfig(): PirateConfig {
        return this._gameConfig;
    }
    public set gameConfig(v: PirateConfig) {
        this._gameConfig = v;
    }

    private _gameControlConfig: PirateControlConfig;
    public get gameControlConfig(): PirateControlConfig {
        return this._gameControlConfig;
    }
    public set gameControlConfig(v: PirateControlConfig) {
        this._gameControlConfig = v;
    }

    private _coin: number;
    public get coin(): number {
        return this._coin;
    }
    public set coin(v: number) {
        this._coin = v;
        this._pirateIndex.updateUserCoin(this.userId, v);
    }

    abstract kick:boolean

    //abstract betAndSettle(channelId: string | number, amount: number, auto:boolean, tag:string,level:number):void;

    abstract setControl(V:any):void;

    abstract stop():void;

    abstract run(count: number, amount: number, channelId, auto: boolean, tag: string,level:number):void;

    /** 开关快速模式 */
    abstract turbo():boolean;

}
