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
export const automaticLogin = (username) => {//username
    return request({
        url: '/automaticLogin',
        method: 'POST',
        data:{
            username,
            channel:'9gamed',
            gameCode: process.env.VUE_APP_GAME_CODE
        }
    })
}
