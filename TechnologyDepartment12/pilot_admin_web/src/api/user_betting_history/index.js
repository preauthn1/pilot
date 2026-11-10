import request from '@/utils/request'

export function getCoinRecordList(data) {
  return request({
    url: '/coinRecord/getCoinRecordList',
    method: 'post',
    data,
  })
}
