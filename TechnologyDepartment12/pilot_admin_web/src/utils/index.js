import store from '@/store'
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
  const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
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
 * @description 格式化时间
 * @param time
 * @param option
 * @returns {string}
 */
export function formatTime(time, option) {
  if (('' + time).length === 10) {
    time = parseInt(time) * 1000
  } else {
    time = +time
  }
  const d = new Date(time)
  const now = Date.now()

  const diff = (now - d) / 1000

  if (diff < 30) {
    return '刚刚'
  } else if (diff < 3600) {
    // less 1 hour
    return Math.ceil(diff / 60) + '分钟前'
  } else if (diff < 3600 * 24) {
    return Math.ceil(diff / 3600) + '小时前'
  } else if (diff < 3600 * 24 * 2) {
    return '1天前'
  }
  if (option) {
    return parseTime(time, option)
  } else {
    return (
      d.getMonth() +
      1 +
      '月' +
      d.getDate() +
      '日' +
      d.getHours() +
      '时' +
      d.getMinutes() +
      '分'
    )
  }
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
 * @description 父子关系的数组转换成树形结构数据
 * @param data
 * @returns {*}
 */
export function translateDataToTree(data) {
  const parent = data.filter(
    (value) =>
      value.parentId === 'undefined' ||
      value.parentId === null ||
      value.parentId === 0
  )
  const children = data.filter(
    (value) =>
      value.parentId !== 'undefined' &&
      value.parentId !== null &&
      value.parentId !== 0
  )
  const translator = (parent, children) => {
    parent.forEach((parent) => {
      children.forEach((current, index) => {
        if (current.parentId === parent.id) {
          const temp = JSON.parse(JSON.stringify(children))
          temp.splice(index, 1)
          translator([current], temp)
          typeof parent.children !== 'undefined'
            ? parent.children.push(current)
            : (parent.children = [current])
        }
      })
    })
  }
  translator(parent, children)
  return parent
}

/**
 * @description 树形结构数据转换成父子关系的数组
 * @param data
 * @returns {[]}
 */
export function translateTreeToData(data) {
  const result = []
  data.forEach((item) => {
    const loop = (data) => {
      result.push({
        id: data.id,
        name: data.name,
        parentId: data.parentId,
      })
      const child = data.children
      if (child) {
        for (let i = 0; i < child.length; i++) {
          loop(child[i])
        }
      }
    }
    loop(item)
  })
  return result
}

/**
 * @description 10位时间戳转换
 * @param time
 * @returns {string}
 */
export function tenBitTimestamp(time) {
  const date = new Date(time * 1000)
  const y = date.getFullYear()
  let m = date.getMonth() + 1
  m = m < 10 ? '' + m : m
  let d = date.getDate()
  d = d < 10 ? '' + d : d
  let h = date.getHours()
  h = h < 10 ? '0' + h : h
  let minute = date.getMinutes()
  let second = date.getSeconds()
  minute = minute < 10 ? '0' + minute : minute
  second = second < 10 ? '0' + second : second
  return y + '年' + m + '月' + d + '日 ' + h + ':' + minute + ':' + second //组合
}

/**
 * @description 13位时间戳转换
 * @param time
 * @returns {string}
 */
export function thirteenBitTimestamp(time) {
  const date = new Date(time / 1)
  const y = date.getFullYear()
  let m = date.getMonth() + 1
  m = m < 10 ? '' + m : m
  let d = date.getDate()
  d = d < 10 ? '' + d : d
  let h = date.getHours()
  h = h < 10 ? '0' + h : h
  let minute = date.getMinutes()
  let second = date.getSeconds()
  minute = minute < 10 ? '0' + minute : minute
  second = second < 10 ? '0' + second : second
  return y + '年' + m + '月' + d + '日 ' + h + ':' + minute + ':' + second //组合
}

/**
 * @description 获取随机id
 * @param length
 * @returns {string}
 */
export function uuid(length = 32) {
  const num = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
  let str = ''
  for (let i = 0; i < length; i++) {
    str += num.charAt(Math.floor(Math.random() * num.length))
  }
  return str
}

/**
 * @description m到n的随机数
 * @param m
 * @param n
 * @returns {number}
 */
export function random(m, n) {
  return Math.floor(Math.random() * (m - n) + n)
}

/**
 * @description addEventListener
 * @type {function(...[*]=)}
 */
export const on = (function () {
  return function (element, event, handler, useCapture = false) {
    if (element && event && handler) {
      element.addEventListener(event, handler, useCapture)
    }
  }
})()

/**
 * @description removeEventListener
 * @type {function(...[*]=)}
 */
export const off = (function () {
  return function (element, event, handler, useCapture = false) {
    if (element && event) {
      element.removeEventListener(event, handler, useCapture)
    }
  }
})()

/**
 * @description 数组打乱
 * @param array
 * @returns {*}
 */
export function shuffle(array) {
  let m = array.length,
    t,
    i
  while (m) {
    i = Math.floor(Math.random() * m--)
    t = array[m]
    array[m] = array[i]
    array[i] = t
  }
  return array
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
 * 单位分转元(表单formatter专用)
 * @param row
 * @param column
 * @param cellValue
 * @param index
 */
export function fenToYuan(row, column, cellValue, index) {
  if (cellValue === null || cellValue === undefined) {
    return 0
  }
  return cellValue / 100
}
/**
 * 单位元转分
 * @param num
 * @returns {number}
 */
export function yuanToFen(row, column, cellValue, index) {
  if (cellValue === null || cellValue === undefined) {
    return 0
  }
  return cellValue * 100
}
/**
 * 默认时间
 * @param dayNum 默认的时间范围
 * @returns {number}
 */
export function timeDefault(dayNum) {
  let date = new Date()
  // 通过时间戳计算
  let defalutStartTime = date.getTime() - dayNum * 24 * 3600 * 1000 // 转化为时间戳
  let defalutEndTime = date.getTime()
  let startDateNs = new Date(defalutStartTime)
  let endDateNs = new Date(defalutEndTime)
  // 月，日 不够10补0
  defalutStartTime =
    startDateNs.getFullYear() +
    '-' +
    (startDateNs.getMonth() + 1 >= 10
      ? startDateNs.getMonth() + 1
      : '0' + (startDateNs.getMonth() + 1)) +
    '-' +
    (startDateNs.getDate() >= 10
      ? startDateNs.getDate()
      : '0' + startDateNs.getDate())
  defalutEndTime =
    endDateNs.getFullYear() +
    '-' +
    (endDateNs.getMonth() + 1 >= 10
      ? endDateNs.getMonth() + 1
      : '0' + (endDateNs.getMonth() + 1)) +
    '-' +
    (endDateNs.getDate() >= 10
      ? endDateNs.getDate()
      : '0' + endDateNs.getDate())
  return [defalutStartTime, defalutEndTime]
}

/**
 * @param ability
 * 导航栏显示
 */
export function showNavigationBar(ability) {
  if (store.state.acl.ability !== null) {
    return store.state.acl.ability.indexOf(ability) !== -1
  }
  return false
}

/**
 * 默认当天时间
 */
export function DefaultTimeToday() {
  // 设置默认选中时间当天0:00:00~23:59：59
  const startDate = new Date()
  const endDate = new Date()
  startDate.setHours(0)
  startDate.setMinutes(0)
  startDate.setSeconds(0)
  endDate.setHours(23)
  endDate.setMinutes(59)
  endDate.setSeconds(59)
  return [parseTime(startDate.valueOf()), parseTime(endDate.valueOf())]
}

/**
 * 默认当天0点到当前时间
 * @returns {string[]}
 * @constructor
 */
export function DefaultTime() {
  // 设置默认选中时间当天0:00:00~当前时间
  const startDate = new Date()
  const endDate = new Date()
  startDate.setHours(0)
  startDate.setMinutes(0)
  startDate.setSeconds(0)
  endDate.getHours()
  endDate.getMinutes()
  endDate.getSeconds()
  return [parseTime(startDate.valueOf()), parseTime(endDate.valueOf())]
}

export function floorNumber(price, fixed) {
  if (!price || isNaN(price)) {
    price = 0
  }
  if (fixed <= 0) {
    return Math.floor(parseFloat(price)).toFixed(0)
  } else {
    let pow = Math.pow(10, fixed)
    return (Math.floor(price * pow) / pow).toFixed(fixed)
  }
}

/**
 * @param {Function} func
 * @param {number} wait
 * @param {boolean} immediate
 * @return {*}
 */
export function debounce(func, wait, immediate) {
  let timeout, args, context, timestamp, result

  const later = function () {
    // 据上一次触发时间间隔
    const last = +new Date() - timestamp

    // 上次被包装函数被调用时间间隔 last 小于设定时间间隔 wait
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last)
    } else {
      timeout = null
      // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
      if (!immediate) {
        result = func.apply(context, args)
        if (!timeout) context = args = null
      }
    }
  }

  return function (...args) {
    context = this
    timestamp = +new Date()
    const callNow = immediate && !timeout
    // 如果延时不存在，重新设定延时
    if (!timeout) timeout = setTimeout(later, wait)
    if (callNow) {
      result = func.apply(context, args)
      context = args = null
    }

    return result
  }
}

// 字符串驼峰转换下划线
export function strToLine(name) {
  return name.replace(/([A-Z])/g, '_$1').toLowerCase()
}
/**
 * table单元格内处理时间
 * @param row
 * @param column
 * @param cellValue
 * @param index
 * @returns {string}
 */
export function cellTimeFormat(row, column, cellValue, index) {
  return rTime(cellValue)
}

/**
 * @param {string} time
 * @returns {string}
 */
export function rTime(time) {
  if (time === '') {
    // 解决deteForm为空传1970-01-01 00:00:00
    return ''
  } else if (time === undefined) {
    return ''
  } else {
    return time
    // return new Date(+new Date(new Date(time).toJSON()) + 7 * 3600 * 1000)
    //   .toISOString()
    //   .replace(/T/g, ' ')
    //   .replace(/\.[\d]{3}Z/, '')
  }
}

/**
 * 检查权限
 * @param value
 * @returns {boolean}
 */
export function checkPermission(value) {
  const accessedRoutes = store.getters && store.getters['routes/routes']
  if (value && typeof value === 'string') {
    if (value.length > 0) {
      const hasPermission = function (accessedRoutes) {
        accessedRoutes.forEach((role) => {
          if (role.children && role.children.length > 0) {
            hasPermission(role.children)
          } else {
            if (
              Object.prototype.hasOwnProperty.call(role, 'name') &&
              role.name === value
            ) {
              throw new Error('hasPermission')
            }
          }
        })
      }

      let check = false
      try {
        hasPermission(accessedRoutes)
      } catch (e) {
        if (e.message === 'hasPermission') check = true
      }
      if (check) {
        return true
      }
    }
  } else {
    throw new Error(`need permission! Like v-permission="'user.create'"`)
  }
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
