import request from '@/utils/request'

export function getTaskUserList(data) {
  return request({
    url: '/taskUser/getTaskUserList',
    method: 'post',
    data,
  })
}

export function acceptTask(data) {
  return request({
    url: '/taskUser/acceptTask',
    method: 'post',
    data,
  })
}
