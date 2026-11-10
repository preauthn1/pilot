/**
 * @description 游戏状态管理
 */
const state = () => ({
    status: -1,  // 游戏状态
    gameStartTime: 0, // 开始时间
    currentMultiple: 0, // 当前倍数
    waitTime: null, // 等待时间
    syncPoint: null, // 初始同步倍数
    winSound: null, // 结算成功音效
    openGame:false,//是否打开游戏
    progress:20,//进度条
})
const getters = {
    status: (state) => state.status,
    gameStartTime: (state) => state.gameStartTime,
    currentMultiple: (state) => state.currentMultiple,
    waitTime: (state) => state.waitTime,
    syncPoint: (state) => state.syncPoint,
    winSound: (state) => state.winSound,
    openGame:(state)=>state.openGame,
    progress:(state)=>state.progress
}
const mutations = {
    updataeOpengame(state){
        state.openGame = true
    },
    updateStatus(state, status) {
        state.status = status
    },
    updateStartTime(state, time) {
        state.gameStartTime = time
    },
    updateMultiple(state, multiple) {
        state.currentMultiple = multiple
    },
    setWaitTime(state, time) {
        state.waitTime = time
    },
    setSyncPoint(state, point) {
        state.syncPoint = point
    },
    winSound(state, value) {
        state.winSound = value
    },
    updataProgress(state, value) {
        state.progress = value
    },
}
const actions = {
    updataeOpengame({ commit }){
        commit('updataeOpengame')
    },
    updateStatus({ commit }, status) {
        commit('updateStatus', status)
        if (status === 1) {
            commit('updateStartTime', Date.now())
        }
        if (status === 2) {
            commit('setSyncPoint', [])
        }
    },
    updateStartTime({ commit }, time) {
        commit('updateStartTime', time)
    },
    updateMultiple({ commit }, multiple) {
        commit('updateMultiple', multiple)
    },
    setWaitTime({ commit }, time) {
        commit('setWaitTime', time)
    },
    setSyncPoint({ commit }, point) {
        if (Array.isArray(point)) {
            commit('setSyncPoint', point)
            const count = point.length
            const time = count * 200
            commit('updateStartTime', Date.now() - time)
            commit('updateMultiple', point[count - 1])
        }

    },
}

export default { state, getters, mutations, actions }
