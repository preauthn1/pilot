import request from '@/utils/request'

export function getGameRecordList(data) {
  return request({
    url: '/gameRecord/getGameRecordList',
    method: 'post',
    data,
  })
}
