import request from '@/utils/request'

export function getSystemConfigList(data) {
  return request({
    url: '/systemConfig/getSystemConfigList',
    method: 'post',
    data,
  })
}

export function create(data) {
  return request({
    url: '/systemConfig/create',
    method: 'post',
    data,
  })
}

export function update(data) {
  return request({
    url: '/systemConfig/update',
    method: 'post',
    data,
  })
}

export function delSystemConfig(data) {
  return request({
    url: '/systemConfig/delSystemConfig',
    method: 'post',
    data,
  })
}
