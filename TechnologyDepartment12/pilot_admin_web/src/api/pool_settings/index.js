import request from '@/utils/request'

export function getPoolList(data) {
  return request({
    url: '/poolSetting/getPoolList',
    method: 'post',
    data,
  })
}

export function create(data) {
  return request({
    url: '/poolSetting/create',
    method: 'post',
    data,
  })
}

export function update(data) {
  return request({
    url: '/poolSetting/update',
    method: 'post',
    data,
  })
}
