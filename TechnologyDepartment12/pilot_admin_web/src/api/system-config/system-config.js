import request from '@/utils/request'

export function systemConfigs(data) {
  return request({
    url: '/systemConfig/systemConfigSet',
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

export function systemConfigDelete(data) {
  return request({
    url: '/systemConfig/delete',
    method: 'post',
    data,
  })
}
