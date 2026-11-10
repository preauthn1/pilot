// 不好处理浮点型，所以*100处理
export function randResult(rebate: number) {
    rebate = rebate < 1 ? 1 : rebate
    const rand = Math.floor(Math.random() * (0xffffffff + 1))
   // const rand = Math.floor(Math.random() * 100000000000)
    return Math.floor(Math.max(1, (2 ** 32 / (rand + 1)) * (1 - rebate / 100)) * 100);
}
// 每同步10次之后进行加速，加速满足斐波那契数列(1, 1, 2, 3, 5) 改成平均分布算法
export function smooth(result: number) {
    const point = [];
    let value = 99;
    let acceleration = 1; //加速度
    let speed = 10; //速度
    let times = 0;
    for (;;) {
        times += 1;
        value += speed;
        if (result <= value) {
            point.push(result);
            break;
        }
        point.push(value);
        if (times % 20 === 0) {
            speed += acceleration;
        }
        if (times % 30 === 0) {
            acceleration *= 10;
        }
    }
    // for(;;) {
    //     times += 1
    //     value += speed
    //     if(result <= value) {
    //         point.push(result)
    //         break
    //     } else {
    //         point.push(value)
    //     }
    //     if(times % 10 === 0) {
    //         const temp = acceleration + speed
    //         acceleration = speed
    //         speed = temp
    //     }
    // }
    return point
}


export function genUsername() {
    let result = ''
    const str = "012345678901234567890123456789012345678901234567890123456789";  //26个大写字母
    //const str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";  //26个大写字母
    const len = randomNumber(6, 12)
    for (let i = 0; i < len; i ++) {  //根据指定长度生成随机字符串
        let n = Math.floor(Math.random() * str.length);  //获取随机数字
        result += str[n];  //映射成字符串
    }
    return result;  //返回映射后的字符串
}

const origin = []
for (let i = 1; i < 10000; i++) {
    origin.push(i)
}

export function genUserIds(count: number): number[] {
    if (count > 8000) {
        throw 'robot is too much'
    }
    let copy = origin.slice()
    let result = []
    for (let i = 0; i < count; i++) {
        let n = Math.floor(Math.random() * copy.length)
        result.push(copy[n])
        copy.splice(n, 1)
    }
    return result
}

export function randomNumber(min: number, max: number) {
    return Math.floor((Math.random() * (max - min)) + min)
}

export function randomMultiple(min: number, max: number) {
    const round = Math.floor(Math.random() * (max - min) + min)*100
    const lenth = (round+'').length
    return Math.floor(round/Math.pow(10,Math.floor(lenth/2)+1))*Math.pow(10,Math.floor(lenth/2)+1)
}

export function weight(multipleConfig:{minMultiple: number, maxMultiple: number, chance: number, base: number}[]): {section: {maxMultiple: number, minMultiple: number, startSection: number, lastSection:number, base: number}[], lastSection: number} {
    const expand = 10
    let startSection = 0
    // 划分区间
    let section = []
    multipleConfig.forEach(e => {
        let currentSection = (startSection + e.chance*expand)
        if(!e.base){
            e.base = 1
        }
        section.push({maxMultiple: e.maxMultiple, minMultiple: e.minMultiple, startSection: startSection+1, lastSection: currentSection, base: e.base})
        startSection = currentSection
    })
    return {section: section, lastSection: startSection}
}

export function multiple(probability: {section: {maxMultiple: number, minMultiple: number, startSection: number, lastSection:number}[], lastSection: number}): number{
    let rand = randomNumber(1, probability.lastSection)
    let mulriple = 1.1
    
    for (const session of probability.section) {
        if (rand >= session.startSection && rand <= session.lastSection) {
            mulriple = Math.floor(((Math.random() * (session.maxMultiple -  session.minMultiple)) +  session.minMultiple)*100)
            break
        }
    }
    return mulriple

}

export function genBetCount(probability: {section: {maxMultiple: number, minMultiple: number, startSection: number, lastSection:number, base: number}[], lastSection: number}): number{
    let rand = randomNumber(1, probability.lastSection)
    let betCount = 0
    for (const session of probability.section) {
        if (rand >= session.startSection && rand <= session.lastSection) {
            betCount = Math.floor(((Math.random() * (session.maxMultiple -  session.minMultiple)) +  session.minMultiple))*session.base
            break
        }
    }
    return betCount

}
