import request from '@/utils/request'

export function getCurrencyList(data) {
  return request({
    url: '/currencySetting/getCurrencyList',
    method: 'post',
    data,
  })
}

export function create(data) {
  return request({
    url: '/currencySetting/create',
    method: 'post',
    data,
  })
}

export function update(data) {
  return request({
    url: '/currencySetting/update',
    method: 'post',
    data,
  })
}

export function deleteCurrency(data) {
  return request({
    url: '/currencySetting/deleteCurrency',
    method: 'post',
    data,
  })
}
