import request from '@/utils/request'

export function getGameControlSettingList(data) {
  return request({
    url: '/gameControlSet/getGameControlSettingList',
    method: 'post',
    data,
  })
}

export function updateMaintain(data) {
  return request({
    url: '/gameControlSet/updateMaintain',
    method: 'post',
    data,
  })
}

export function updateAddCoinStatus(data) {
  return request({
    url: '/gameControlSet/updateAddCoinStatus',
    method: 'post',
    data,
  })
}

export function updateLowerCoinStatus(data) {
  return request({
    url: '/gameControlSet/updateLowerCoinStatus',
    method: 'post',
    data,
  })
}

export function updateGameMax(data) {
  return request({
    url: '/gameControlSet/updateGameMax',
    method: 'post',
    data,
  })
}
