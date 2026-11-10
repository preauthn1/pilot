export function date2Number(date: Date) {
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()
    const h = date.getHours()
    const min = date.getMinutes()
    const s = date.getSeconds()
    return s + min * 100 + h * 10000 + d * 1000000 + m * 100000000 + y * 10000000000
}

export function systemDateString(timestamp = Date.now()): string {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * @param delay 毫秒   1000 = 1秒
 *   */
export async function delayTime(delay = 0) {
    return new Promise<void>((resolve, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            resolve();
        }, delay);
    })
}

export function generateUniqueUuid(): number {
    // const uuid = Math.floor(Math.random() * 1000000000000).toString().padStart(15, '0');
    // return uuid;
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(2, '0');
    const id = year + month + day + hours + minutes + seconds + milliseconds + random;
    return parseInt(id);
}

