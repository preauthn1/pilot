import request from '@/utils/request'

export function monitorLogin(data) {
  return request({
    url: '/monitor/monitorLogin',
    method: 'get',
    params: data,
  })
}

export function realTimeSettlement(data) {
  return request({
    url: '/monitor/realTimeSettlement',
    method: 'post',
    data,
  })
}
