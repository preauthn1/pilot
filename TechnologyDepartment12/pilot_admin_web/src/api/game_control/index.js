import request from '@/utils/request'

export function getGameControlList(data) {
  return request({
    url: '/gameControl/getGameControlList',
    method: 'post',
    data,
  })
}

export function update(data) {
  return request({
    url: '/gameControl/update',
    method: 'post',
    data,
  })
}

export function create(data) {
  return request({
    url: '/gameControl/create',
    method: 'post',
    data,
  })
}

export function updateMaintain(data) {
  return request({
    url: '/gameControl/updateMaintain',
    method: 'post',
    data,
  })
}

export function updateGameMax(data) {
  return request({
    url: '/gameControl/updateGameMax',
    method: 'post',
    data,
  })
}
