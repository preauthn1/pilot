import request from '@/utils/request'

export function getMerchantReportList(data) {
  return request({
    url: '/merchantReport/getMerchantReportList',
    method: 'post',
    data,
  })
}
