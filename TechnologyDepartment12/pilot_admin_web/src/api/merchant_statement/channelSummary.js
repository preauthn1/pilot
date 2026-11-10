import request from '@/utils/request'

export function getChannelReportList(data) {
  return request({
    url: '/merchantReport/getChannelReportList',
    method: 'post',
    data,
  })
}

export function getRealtimeChannelReport(data) {
  return request({
    url: '/merchantReport/getRealtimeChannelReport',
    method: 'post',
    data,
  })
}
