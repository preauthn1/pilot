import i18n from '@/i18n'
/**
 * 自定义表单校验
 */
const matching = (value, callback, reg, message) => {
  if (value === '' || value === undefined || value === null) {
    callback()
  } else {
    if (!reg.test(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

// 校验正整数
export function Integer(rule, value, callback) {
  const reg = /^[1-9][0-9]*$/
  matching(value, callback, reg, i18n.t('validateErrorMsg.integer'))
}

// 校验整数（包含0）
export function Numeric(rule, value, callback) {
  const reg = /^([1-9][0-9]*|0)$/
  matching(value, callback, reg, i18n.t('validateErrorMsg.numeric'))
}

// 校验数字类型(包含小数)
export function Number(rule, value, callback) {
  const reg = /^[0]\.\d{1,2}$|^[1-9]\d*(?:\.\d{1,2})?$|^[0]$/
  matching(value, callback, reg, i18n.t('validateErrorMsg.number'))
}

// 校验数字类型(包含小数)
export function Int(rule, value, callback) {
  const reg = value.replace(/([\u4E00-\u9FA5]|[A-Za-z])+/, '')
    .replace(/[^\d]/, '').replace(/.*\..*/, '')
    .replace(/[\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/, '')
  const message = i18n.t('validateErrorMsg.num')
  if (!reg) {
    callback(new Error(message))
  } else {
    callback()
  }
}
