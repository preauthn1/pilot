//[min,max)
export function getRandomNum(min: number, max: number): number {
    const range = max - min
    const rand = Math.random()
    return min + Math.floor(rand * range)
}

/** 按照概率生成布尔值,参数值范围为0~1之间 */
export function generateBoolean(probability: number): boolean {
    return Math.random() < probability;
}

/** 生成两个数字之间（包含两个数）的随机整数 */
export function randomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * minNum + 1 + "", 10);
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
        default:
            return 0;
    }
}

/** 按权重获取元素 */
export function weightedRandomSelection<T>(arr: T[], weights: number[]): T {
    let totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < arr.length; i++) {
        if (random < weights[i]) {
            return arr[i];
        }
        random -= weights[i];
    }
    return arr[arr.length - 1]; // 如果所有权重之和为 0，则返回最后一个元素
}

/** 随机管理 */
export class RandomManager {
    private static _instance: RandomManager;
    public static get instance(): RandomManager {
        if (this._instance == null) {
            this._instance = new RandomManager();
        }
        return this._instance;
    }

    // constructor() {
    //     this.setSeed(1);

    //     for (let index = 0; index < 10; index++) {
    //         console.log(this.getRandomInt(0, 100));
    //     }

    //     var a = this.getRandomByMinMaxList(50, 100, 5)
    //     console.log("随机的数字", a);

    //     var b = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    //     var r = this.getRandomByObjectList(b, 5);
    //     console.log("原始的对象", b);
    //     console.log("随机的对象", r);

    //     var c = this.getRandomBySumList(5, -100,);
    //     console.log("定和随机分配", c);
    // }

    private seedrandom!: any;
    private getRandom(): number {
        if (this.seedrandom)
            return this.seedrandom.quick();

        return Math.random();
    }

    /** 设置随机种子 */
    setSeed(seed: number) {
        //@ts-ignore
        this.seedrandom = new Math.seedrandom(seed);
    }

    /**
     * 生成指定范围的随机整数
     * @param min   最小值
     * @param max   最大值
     * @param type  类型
     */
    getRandomInt(min: number, max: number, type: number = 2): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        switch (type) {
            case 1: // [min,max) 得到一个两数之间的随机整数,这个值不小于min（如果min不是整数的话，得到一个向上取整的 min），并且小于（但不等于）max  
                return Math.floor(this.getRandom() * (max - min)) + min;
            case 2: // [min,max] 得到一个两数之间的随机整数，包括两个数在内,这个值比min大（如果min不是整数，那就不小于比min大的整数），但小于（但不等于）max
                return Math.floor(this.getRandom() * (max - min + 1)) + min;
            case 3: // (min,max) 得到一个两数之间的随机整数
                return Math.floor(this.getRandom() * (max - min - 1)) + min + 1;
        }
        return 0;
    }

    /**
     * 根据最大值，最小值范围 生成随机数数组
     * @param min   最小值
     * @param max   最大值
     * @param n     随机个数
     * @param type  类型
     * @returns 
     */
    getRandomByMinMaxList(min: number, max: number, n: number, type: number = 2): Array<number> {
        var result: Array<number> = [];
        for (let i = 0; i < n; i++) {
            result.push(this.getRandomInt(min, max))
        }
        return result;
    }

    /**
     * 根据最大值，最小值范围 生成随机数数组(不重复随机数组)
     * @param n     随机个数
     * @returns 
     */
    getRandomByMinMaxList_NotRepeated(n: number): Array<number> {
        let values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
        var temp = values;
        var result = [];
        for (let i = 0; i < n; i++) {
            let index = this.getRandomInt(0, temp.length - 1, 2)
            result.push(temp.splice(index, 1)[0])
        }
        return result
    }


    /**
     * 随机固定数组值
     * @values 固定的数组
     * @num 在数组中要随机多少个值
     */
    getRandomByFiex_NotRepeated(values: number[], num: number): Array<number> {
        var temp = values;
        var result = [];
        for (let i = 0; i < num; i++) {
            let index = this.getRandomInt(0, temp.length - 1, 2)
            result.push(temp.splice(index, 1)[0])
        }
        return result;
    }




    /**
     * 随机机器人下注金额
     */
    getRandomByRobotBetAount(): number {
        var temp = [1, 2, 3, 4, 5, 6, 7, 4, 5, 6, 7, 4, 5, 6, 7, 8, 9, 10];
        var temp1 = ['00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00', '00',
            '000', '000', '000', '000', '000', '000', '000', '000', '000', '000', '000'
            , '0000', '0000', '0000', '0000', '0000', '0000', '0000', '0000', '0000'
            , '00000', '00000', '00000', '000000', '0000000']

        let index = this.getRandomInt(0, temp.length - 1)
        let index1 = this.getRandomInt(0, temp1.length - 1)

        return parseInt(temp[index].toString() + temp1[index1]);
    }



    /**
     * 获取数组中随机对象
     * @param objects 对象数组
     * @param n 随机个数
     * @returns 
     */
    getRandomByObjectList<T>(objects: Array<T>, n: number): Array<T> {
        var temp: Array<T> = objects.slice();
        var result: Array<T> = [];
        for (let i = 0; i < n; i++) {
            let index = this.getRandomInt(0, n, 1);
            result.push(temp.splice(index, 1)[0]);
        }
        return result;
    }

    /**
     * 定和随机分配
     * @param n     随机数量
     * @param sum   随机元素合
     * @returns 
     */
    getRandomBySumList(n: number, sum: number) {
        var residue = sum;
        var value = 0;
        var result: Array<number> = [];
        for (let i = 0; i < n; i++) {
            value = this.getRandomInt(0, residue, 3);
            if (i == n - 1) {
                value = residue;
            }
            else {
                residue -= value;
            }
            result.push(value);
        }
        return result;
    }
}