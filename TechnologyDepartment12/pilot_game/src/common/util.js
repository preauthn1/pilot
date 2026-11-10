import Md5 from 'js-md5'

/**
 * @description 格式化时间
 * @param time
 * @param cFormat
 * @returns {string|null}
 */
export function parseTime(time, cFormat) {
    if (arguments.length === 0) {
        return null
    }
    const format = cFormat || '{y}/{m}/{d} {h}:{i}:{s}'
    let date
    if (typeof time === 'object') {
        date = time
    } else {
        if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
            time = parseInt(time)
        }
        if (typeof time === 'number' && time.toString().length === 10) {
            time = time * 1000
        }
        date = new Date(time)
    }
    const formatObj = {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
        a: date.getDay(),
    }
    return format.replace(/{([ymdhisa])+}/g, (result, key) => {
        let value = formatObj[key]
        if (key === 'a') {
            return ['日', '一', '二', '三', '四', '五', '六'][value]
        }
        if (result.length > 0 && value < 10) {
            value = '0' + value
        }
        return value || 0
    })
}

export function parseTime2(time, cFormat) {
    if (arguments.length === 0) {
        return null
    }
    const format = cFormat || '{d}-{m} {h}:{i}'
    let date
    if (typeof time === 'object') {
        date = time
    } else {
        if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
            time = parseInt(time)
        }
        if (typeof time === 'number' && time.toString().length === 10) {
            time = time * 1000
        }
        date = new Date(time)
    }
    const formatObj = {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
        a: date.getDay(),
    }
    return format.replace(/{([ymdhisa])+}/g, (result, key) => {
        let value = formatObj[key]
        if (key === 'a') {
            return ['日', '一', '二', '三', '四', '五', '六'][value]
        }
        if (result.length > 0 && value < 10) {
            value = '0' + value
        }
        return value || 0
    })
}

/**
 * @description 将url请求参数转为json格式
 * @param url
 * @returns {{}|any}
 */
export function paramObj(url) {
    const search = url.split('?')[1]
    if (!search) {
        return {}
    }
    return JSON.parse(
        '{"' +
        decodeURIComponent(search)
            .replace(/"/g, '\\"')
            .replace(/&/g, '","')
            .replace(/=/g, '":"')
            .replace(/\+/g, ' ') +
        '"}'
    )
}

/**
 * 清除对象的的值，number赋值为0，string赋值为'',bool赋值为false
 * @param {Object} obj
 * @return {*}
 * */

export function clearObj(obj) {
    if (!obj && typeof obj !== 'object') {
        throw new Error('error arguments', 'deepCopy')
    }
    Object.keys(obj).forEach((keys) => {
        if (obj[keys] === null || obj[keys] === undefined) {
            return
        }
        if (typeof obj[keys] === 'object') {
            if (obj[keys] instanceof Array) {
                obj[keys] = []
            } else {
                clearObj(obj[keys])
            }
        } else if (typeof obj[keys] === 'number') {
            obj[keys] = 0
        } else if (typeof obj[keys] === 'string') {
            obj[keys] = ''
        } else if (typeof obj[keys] === 'boolean') {
            obj[keys] = false
        }
    })
}
/**
 * 简单的深度克隆,如果目标对象的属性名和源对象一致，那么把源对象属性的值赋值给目标对象
 * @param {Object} target
 * @param {Object} source
 * @return {*}
 * */
export function deepCopy(target, source) {
    if (
        (!source && typeof source !== 'object') ||
        (!target && typeof target !== 'object')
    ) {
        throw new Error('error arguments', 'deepCopy')
    }
    Object.keys(target).forEach((keys) => {
        if (keys in source) {
            if (
                source[keys] !== null &&
                source[keys] !== undefined &&
                typeof source[keys] === 'object'
            ) {
                deepClone(target[keys], source[keys])
            } else {
                target[keys] = source[keys]
            }
        }
    })
}

/**
 * This is just a simple version of deep copy
 * Has a lot of edge cases bug
 * If you want to use a perfect deep copy, use lodash's _.cloneDeep
 * @param {Object} source
 * @returns {Object}
 */
export function deepClone(source) {
    if (!source && typeof source !== 'object') {
        throw new Error('error arguments', 'deepClone')
    }
    const targetObj = source.constructor === Array ? [] : {}
    Object.keys(source).forEach((keys) => {
        if (source[keys] && typeof source[keys] === 'object') {
            targetObj[keys] = deepClone(source[keys])
        } else {
            targetObj[keys] = source[keys]
        }
    })
    return targetObj
}


/**
 * @description 驼峰转下划线
 * @param object
 * @returns object
 */
export function objectHumpToLine(o) {
    if (typeof o !== 'object') {
        throw 'error args : object hump to line[' + typeof o + ']'
    }
    if (Array.isArray(o)) {
        const arr = []
        o.forEach((e) => {
            if (typeof e === 'object') arr.push(objectHumpToLine(e))
            else {
                return arr.push(e)
            }
        })
        return arr
    } else {
        const obj = {}
        for (let key in o) {
            const v = o[key]
            // 如果是对象，那么递归一下
            if (typeof v === 'object') {
                obj[key.replace(/([A-Z])/g, '_$1').toLowerCase()] = objectHumpToLine(v)
            } else {
                obj[key.replace(/([A-Z])/g, '_$1').toLowerCase()] = v
            }
        }
        return obj
    }
}

/**
 * @description 下划线转驼峰
 * @param object
 * @returns object
 */
export function objectLineToHump(o) {
    if (typeof o !== 'object') {
        throw 'error args : object line to hump[' + typeof o + ']'
    }
    if (Array.isArray(o)) {
        const arr = []
        o.forEach((e) => {
            if (typeof e === 'object') arr.push(objectLineToHump(e))
            else {
                return arr.push(e)
            }
        })
        return arr
    } else {
        const obj = {}
        for (let key in o) {
            const v = o[key]
            if (typeof v === 'object') {
                obj[
                    key.replace(/_(\w)/g, function (all, letter) {
                        return letter.toUpperCase()
                    })
                    ] = objectLineToHump(v)
            } else {
                obj[
                    key.replace(/_(\w)/g, function (all, letter) {
                        return letter.toUpperCase()
                    })
                    ] = v
            }
        }
        return obj
    }
}

/**
 * 按ascii码从小到大排序
 * @param obj
 * @returns object
 */
function sortAscii(obj) {
    let arr = [];
    Object.keys(obj).forEach(item => arr.push(item))
    let sortArr = arr.sort();
    let sortObj = {};    //完成排序值
    for (let i in sortArr) {
        sortObj[sortArr[i]] = obj[sortArr[i]];
    }
    return sortObj;
}

/**
 *  普通的ascii码排序md5签名
 */
export function asciiMd5Sign(params, key, toUpper = false) {
    if (!params) {
        return false;
    }
    params = sortAscii(params);
    key = key || process.env.ENCRY_KEY
    let arr = []
    for (let i in params) {
        arr.push(encodeURIComponent(i) + '=' + encodeURIComponent(params[i]))
    }
    const md5Str = arr.join('&') + '&key=' + key
    const sign = Md5(md5Str)
    return toUpper ? sign.toUpperCase() : sign;
}