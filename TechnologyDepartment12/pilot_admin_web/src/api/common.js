import request from '@/utils/request'

export function dictMaps(data) {
  return request({
    url: '/common/dictMaps',
    method: 'post',
    data,
  })
}
