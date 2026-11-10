import request from '@/utils/request'

export function getCoinLogList(data) {
  return request({
    url: '/coinLog/getCoinLogList',
    method: 'post',
    data,
  })
}
