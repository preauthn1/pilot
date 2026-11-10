import request from '@/utils/request'

export function getServerConfigList(data) {
  return request({
    url: '/serverConfig/getServerConfigList',
    method: 'post',
    data,
  })
}

export function create(data) {
  return request({
    url: '/serverConfig/create',
    method: 'post',
    data,
  })
}

export function update(data) {
  return request({
    url: '/serverConfig/update',
    method: 'post',
    data,
  })
}
