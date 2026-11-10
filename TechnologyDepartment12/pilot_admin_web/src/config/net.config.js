/**
 * @description 导出网络配置
 **/
let prefix = 'http://'
if (typeof window !== 'undefined') {
  let protocolStr = document.location.protocol
  if (protocolStr === 'https:') {
    prefix = 'https://'
  }
}

let lineUrl = ''
try {
  lineUrl = process.env.VUE_APP_BASE_API.split(',')[0]
} catch {}
// 如果 env 中已包含协议，不再拼接 prefix
if (!/^https?:\/\//.test(lineUrl)) {
  lineUrl = prefix + lineUrl
}
/* eslint-disable */
/* eslint-enable */

module.exports = {
  // 默认的接口地址，开发环境和生产环境走/mock-server
  // 当然你也可以选择自己配置成需要的接口地址，如"https://api.xxx.com"
  baseURL: lineUrl,
  // 配后端数据的接收方式application/json;charset=UTF-8 或 application/x-www-form-urlencoded;charset=UTF-8
  contentType: 'application/json;charset=UTF-8',
  // 最长请求时间
  requestTimeout: 10000,
  // 操作正常code，支持String、Array、int多种类型
  successCode: [200, 0, '200', '0'],
  // 数据状态的字段名称
  statusName: 'code',
  // 状态信息的字段名称
  messageName: 'message',
}
