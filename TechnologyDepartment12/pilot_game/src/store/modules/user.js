/**
 * @description 用户信息
 */
const state = () => ({
    userId: null,
    username: null,
    coin: 0,  // 用户余额
    betInfo: null,  // 用户下注信息
    availableCoin: 0, //用户可用余额
})
const getters = {
    coin: (state) => state.coin,
    betInfo: (state) => state.betInfo,
    availableCoin: (state) => state.availableCoin,
}
const mutations = {
    setCoin(state, coin) {
        state.coin = coin
        state.availableCoin = coin
    },
    setAvailableCoin(state, coin) {
        state.availableCoin = coin
    },
    setBetInfo(state, data) {
        state.betInfo = data
    },
    init(state, {userId, username, coin}) {
        state.userId = userId
        state.username = username
        state.coin = coin
        state.availableCoin = coin
    },
    updateUserInfo(state, obj) {
        Object.keys(obj).map(v => {
            state[v] = obj[v]
            if(v === 'coin') {
                state.availableCoin =  obj[v]
            }
        })
    },
}

const actions = {

}

export default { state, getters, mutations, actions }
