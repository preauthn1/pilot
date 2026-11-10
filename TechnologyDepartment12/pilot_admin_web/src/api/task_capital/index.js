import request from '@/utils/request'

export function getTaskCapitalList(data) {
  return request({
    url: '/taskCapital/getTaskCapitalList',
    method: 'post',
    data,
  })
}
