
const tokenTableName = 'token'

/**
 * @description 获取token
 */
export function getToken() {
    return localStorage.getItem(tokenTableName)
}

/**
 * @description 存储token
 * @param token
 * @returns {void|*}
 */
export function setToken(token) {
    return localStorage.setItem(tokenTableName, token)
}

/**
 * @description 移除token
 * @returns {void|Promise<void>}
 */
export function removeToken() {
    return localStorage.removeItem(tokenTableName)
}
