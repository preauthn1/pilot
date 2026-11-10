import request from '@/utils/request'

export function getMerchantList(data) {
  return request({
    url: '/merchant/getMerchantList',
    method: 'post',
    data,
  })
}

export function create(data) {
  return request({
    url: '/merchant/create',
    method: 'post',
    data,
  })
}

export function update(data) {
  return request({
    url: '/merchant/update',
    method: 'post',
    data,
  })
}

export function delMerchant(data) {
  return request({
    url: '/merchant/delMerchant',
    method: 'post',
    data,
  })
}

export function editPwd(data) {
  return request({
    url: '/merchant/editPwd',
    method: 'post',
    data,
  })
}
