import request from '@/utils/request'

export function getDailyReportList(data) {
  return request({
    url: '/merchantReport/getDailyReportList',
    method: 'post',
    data,
  })
}
