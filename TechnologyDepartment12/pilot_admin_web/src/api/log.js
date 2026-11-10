import request from '@/utils/request'

export function blacklist(data) {
  return request({
    url: '/log/blacklist',
    method: 'post',
    data,
  })
}

export function operationLog(data) {
  return request({
    url: '/log/adminOperationLog',
    method: 'post',
    data,
  })
}
