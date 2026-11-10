import { scheduleJob } from "pinus";
import racing, { Racing } from ".";
import { getRandomNum } from "../../util/random";

export default class Car {
    private speedArr:number[];
    constructor(num) {
        this.carNum = num;
        this.speed = 0;
        this.progress = 0;
        this._run = false;
        this._accelerateCount = 0;
    }

    setSpeedArr(value){
        this.speedArr = value;
    }

    update() {
        if (!this._run)
            return;
        this.progress += this.speed * 0.02;// 1000/50 = 20毫秒
        this.duration -= 1000 / 50;
        if (this.duration <= 0) {
            this.canChangeSpeed = true;
        }
    }

    changeSpeed(chiXu, speed) {
        if (this.canChangeSpeed) {
            this.duration = chiXu * 1000;
            this.speed = speed;
        }
        this.canChangeSpeed = false;
    }

    private _run: boolean;

    get run(): boolean {
        return this._run;
    }

    set run(v) {
        this._run = v;
    }

    
    private _useTime : number;
    public get useTime() : number {
        return this._useTime;
    }
    public set useTime(v : number) {
        this._useTime = v;
    }
    

    private _isJisSu: boolean;
    public get isJisSu(): boolean {
        return this._isJisSu;
    }
    public set isJisSu(v: boolean) {
        this._isJisSu = v;
    }


    //暴力加速次数
    private _accelerateCount: number;
    public get accelerateCount(): number {
        return this._accelerateCount;
    }
    public set accelerateCount(v: number) {
        this._accelerateCount = v;
    }


    private _isW: boolean;
    public get isW(): boolean {
        return this._isW;
    }
    public set isW(v: boolean) {
        this._isW = v;
    }


    private _speed: number;
    public get speed(): number {
        return this._speed;
    }
    public set speed(v: number) {
        this._speed = v;
    }


    private _progress: number;
    public get progress(): number {
        return this._progress;
    }
    public set progress(v: number) {
        this._progress = v;
    }


    private _duration: number;
    public get duration(): number {
        return this._duration;
    }
    public set duration(v: number) {
        this._duration = v;
    }


    private _canChangeSpeed: boolean;
    public get canChangeSpeed(): boolean {
        return this._canChangeSpeed;
    }
    public set canChangeSpeed(v: boolean) {
        this._canChangeSpeed = v;
    }


    private _carNum: number;
    public get carNum(): number {
        return this._carNum;
    }
    public set carNum(v: number) {
        this._carNum = v;
    }

    
    private _gameInfo : {speed:number,chiXu:number}[];
    public get gameInfo() : {speed:number,chiXu:number}[] {
        return this._gameInfo;
    }
    public set gameInfo(v : {speed:number,chiXu:number}[]) {
        this._gameInfo = v;
    }
    

    runHandler(len: number):number {
        this.useTime = 0;
        let lapLength = len;
        this.progress = 0;
        this.speed = 0;
        this.gameInfo = [];
       
        while (this.progress < lapLength) {

            let speedAndChixu = this.getSpeedAndChixu();
            if(this.progress + speedAndChixu.speed * (speedAndChixu.chiXu/1000)> lapLength){

                let len1 = lapLength - this.progress;
                let ofSpeed = speedAndChixu.speed / 50;//一帧的速度
                let addLen = 0;
                let frame = 0;
                //1帧20毫秒 ,1秒50帧
                while (addLen < len1) {
                    frame ++;
                    addLen += ofSpeed;
                }
                this.progress += addLen;
                this.useTime += frame * 20;
                this.gameInfo.push(speedAndChixu);
                // if(this.carNum == 1){
                //     console.log("------补帧:",frame);
                // }
               
            }else{
                // if(this.carNum == 1){
                //     console.log("------this.useTime:",this.useTime,speedAndChixu.chiXu,speedAndChixu.speed);
                //     console.log("------this.progress:",this.progress );
                // }
                this.progress += speedAndChixu.speed * (speedAndChixu.chiXu/1000);
                this.useTime += speedAndChixu.chiXu;
                this.gameInfo.push(speedAndChixu);
            }
        }
        // console.log("------车号:",this.carNum,"    isWin:",this.isW);
        // console.log("------用时:",this.useTime / 1000);
        return this.useTime;
    }

    getSpeedAndChixu(): { speed: number, chiXu: number } {
        let obj = {
            speed: 0,
            chiXu: 0
        }
        let speedIndex: number = 0;
        obj.chiXu = getRandomNum(1, 2);
        if (this.isW) {
            speedIndex = getRandomNum(2, 6);
            obj.chiXu = getRandomNum(3, 4);
        } else {
            if (this.accelerateCount > 0) {
                speedIndex = getRandomNum(0, 5);
            } else {
                let ff = getRandomNum(0, 2) > 0 ? true : false;
                if (ff) {
                    speedIndex = 5;
                    this.accelerateCount++;
                    obj.chiXu = getRandomNum(2, 4);
                } else {
                    speedIndex = getRandomNum(0, 4);
                }
            }
        }
        obj.chiXu = obj.chiXu * 1000;
        obj.speed = this.speedArr[speedIndex] * 1.25;
        return obj;
    }

}