import request from '@/utils/request'

export function getTaskList(data) {
  return request({
    url: '/task/getTaskList',
    method: 'post',
    data,
  })
}

export function create(data) {
  return request({
    url: '/task/create',
    method: 'post',
    data,
  })
}

export function update(data) {
  return request({
    url: '/task/update',
    method: 'post',
    data,
  })
}
