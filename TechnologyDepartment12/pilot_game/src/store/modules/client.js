
const state = () => ({
    pomelo: window.pomelo,
    connected: false,
    proto: window.location.protocol === 'https:' ? 'wss' : 'ws',
    address: process.env.VUE_APP_WS_ADDRESS || 'localhost:3050',
    token: null,
    channelId: null,
    gameTag: null,
    gameCode: null,
    tag:'U',
    pageLoad:false,
})

const CONNECT_TIMEOUT = 35000
const MAX_RECONNECT_ATTEMPTS = 3
const getters = {
    pomelo: (state) => state.pomelo,
    connected: (state) => state.connected,
    proto: (state) => state.proto,
    address: (state) => state.address,
    channelId: (state) => state.channelId,
    gameTag: (state) => state.gameTag,
    gameCode: (state) => state.gameCode,
    token: (state) => state.token,
    tag: (state) => state.tag,
    pageLoad:(state)=>state.pageLoad
}
const mutations = {
    connected(state) {
        state.connected = true
    },
    disconnected(state) {
        state.connected = false
    },
    setProto(state, proto) {
        state.proto = proto
    },
    setAddress(state, address) {
        state.address = address
    },
    setToken(state, token) {
        state.token = token
    },
    setChannelId(state, channelId) {
        state.channelId = channelId
    },
    setGameTag(state, gameTag) {
        state.gameTag = gameTag
    },
    setGameCode(state, gameCode) {
        state.gameCode = gameCode
    },
    setTag(state,val){
        state.tag = val;
    },
    setPageLoad(state){
        state.pageLoad = true
    }
}
const actions = {
    async connect({state, commit}) {
        return new Promise((resolve, reject) => {
            let settled = false
            const finish = (callback, value) => {
                if (settled) return
                settled = true
                clearTimeout(timeoutId)
                callback(value)
            }
            const timeoutId = setTimeout(() => {
                finish(reject, new Error('WebSocket connection timeout'))
            }, CONNECT_TIMEOUT)

            state.pomelo.init({
                proto: state.proto,
                address: state.address,
                log: true,
                reconnect: true,
                maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS
            }, function () {
                state.pomelo.request('connector.entryHandler.entry', {token: state.token, gameTag: state.gameTag, gameCode: state.gameCode}, function (data) {
                    if (data.code === 0) {
                        commit('connected')
                        finish(resolve)
                    } else {
                        console.log('connectd error:', data)
                        finish(reject, new Error('connector entry failed'))
                    }
                })
            })
        })
    },
}

export default { state, getters, mutations, actions }
