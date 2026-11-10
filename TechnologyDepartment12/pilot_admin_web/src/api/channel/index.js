import request from '@/utils/request'

export function getChannelLists(data) {
  return request({
    url: '/channel/getChannelLists',
    method: 'post',
    data,
  })
}

export function create(data) {
  return request({
    url: '/channel/create',
    method: 'post',
    data,
  })
}

export function update(data) {
  return request({
    url: '/channel/update',
    method: 'post',
    data,
  })
}

export function delChannel(data) {
  return request({
    url: '/channel/delChannel',
    method: 'post',
    data,
  })
}

export function getChannelBy(data) {
  return request({
    url: '/channel/getChannelBy',
    method: 'post',
    data,
  })
}
