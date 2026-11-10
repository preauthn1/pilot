import request from '@/utils/request'

export function getGameList(data) {
  return request({
    url: '/gameSetting/getGameList',
    method: 'post',
    data,
  })
}

export function update(data) {
  return request({
    url: '/gameSetting/update',
    method: 'post',
    data,
  })
}

export function add(data) {
  return request({
    url: '/gameSetting/add',
    method: 'post',
    data,
  })
}

export function updateMaintain(data) {
  return request({
    url: '/gameSetting/updateMaintain',
    method: 'post',
    data,
  })
}

export function getRobotList(data) {
  return request({
    url: '/robotSetting/getRobotList',
    method: 'post',
    data,
  })
}

export function updateRobot(data) {
  return request({
    url: '/robotSetting/update',
    method: 'post',
    data,
  })
}

export function addRobot(data) {
  return request({
    url: '/robotSetting/add',
    method: 'post',
    data,
  })
}

export function stopGame(data) {
  return request({
    url: '/user/stopGame',
    method: 'post',
    data,
  })
}

export function outAll(data) {
  return request({
    url: '/user/outAll',
    method: 'get',
    params: data,
  })
}
