import request from '@/common/request'

// 获取游戏服务器地址
export const getServerConfig = (token) => {
    return request({
        url: '/serverConfig',
        method: 'POST',
        data: {
            token: token
        }
    })
}

export const getGameConfig = () => {
    return request({
        url: '/gameSetting',
        method: 'GET',
    })
}
export const automaticLogin = () => {///username
    return request({
        url: '/automaticLogin',
        method: 'POST',
        data:{
            username:'1000574'
        }
    })
}
