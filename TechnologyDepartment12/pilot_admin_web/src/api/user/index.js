import request from '@/utils/request'

export function getUserList(data) {
  return request({
    url: '/user/getUserList',
    method: 'post',
    data,
  })
}

export function outGame(data) {
  return request({
    url: '/user/outGame',
    method: 'post',
    data,
  })
}

export function updateUserStatus(data) {
  return request({
    url: '/user/updateUserStatus',
    method: 'post',
    data,
  })
}

export function openAll(data) {
  return request({
    url: '/user/openAll',
    method: 'post',
    data,
  })
}

export function addCoin(data) {
  return request({
    url: '/user/addCoin',
    method: 'post',
    data,
  })
}

export function grantFreeBet(data) {
  return request({
    url: '/user/grantFreeBet',
    method: 'post',
    data,
  })
}

// FIXME: downPoint 后端接口尚未实现，函数暂时移除
// export function downPoint(data) {
//   return request({
//     url: '/user/downPoint',
//     method: 'post',
//     data,
//   })
// }