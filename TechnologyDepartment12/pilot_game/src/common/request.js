import axios from 'axios'
import qs from 'qs'
import store from '@/store'
import { objectHumpToLine, objectLineToHump } from '@/common/util'

const requestTimeout = 30000

let prefix = 'http://'
if (typeof window !== 'undefined') {
    let protocolStr = document.location.protocol
    if (protocolStr === 'https:') {
        prefix = 'https://'
    }
}

/**
 * @description axios初始化
 */
const instance = axios.create({
    baseURL: prefix + process.env.VUE_APP_BASE_API,
    // baseURL: prefix + window.bashURL,
    timeout: requestTimeout,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
    },
})

/**
 * @description axios请求拦截器
 */
instance.interceptors.request.use(
    (config) => {
        const token = store.getters['user/token']
        if (token) config.headers.token = token
        if (config.data) {
            config.data = objectHumpToLine(config.data)
            if (
                config.headers['Content-Type'] ===
                'application/x-www-form-urlencoded;charset=UTF-8'
            ) {
                config.data = qs.stringify(config.data)
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

/**
 * @description axios响应拦截器
 */
instance.interceptors.response.use(
    (response) => {
        const res = response.data
        if (res.code === 0) {
            return objectLineToHump(res)
        } else {
            return Promise.reject(new Error(res.message || 'Error'))
        }
    },
    (error) => {
        console.log('err' + error) // for debug
        return Promise.reject(error)
    }
)

export default instance
