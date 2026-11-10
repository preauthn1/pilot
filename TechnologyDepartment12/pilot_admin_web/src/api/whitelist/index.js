import request from '@/utils/request'

export function getIpList(data) {
  return request({
    url: '/ipList/getIpList',
    method: 'post',
    data,
  })
}

export function create(data) {
  return request({
    url: '/ipList/create',
    method: 'post',
    data,
  })
}
export function del(data) {
    return request({
      url: '/ipList/del',
      method: 'post',
      data,
    })
}
export function update(data) {
    return request({
      url: '/ipList/update',
      method: 'post',
      data,
    })
}