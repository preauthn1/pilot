const state = () => ({
  pomelo: window.pomelo,
  connected: false,
  proto: document.location.protocol === 'https:' ? 'wss' : 'ws',
  address: process.env.VUE_APP_WEBSOCKET_API,
  token: null,
})
const getters = {
  pomelo: (state) => state.pomelo,
  connected: (state) => state.connected,
  proto: (state) => state.proto,
  address: (state) => state.address,
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
}
const actions = {
  async connect({ state, commit }) {
    return new Promise((resolve, reject) => {
      let settled = false
      const timeout = setTimeout(() => {
        finish(new Error('实时监控服务连接超时'))
      }, 10000)
      const cleanup = () => {
        clearTimeout(timeout)
        state.pomelo.off('io-error', onError)
        state.pomelo.off('close', onClose)
        state.pomelo.off('disconnect', onClose)
      }
      const finish = (error) => {
        if (settled) return
        settled = true
        cleanup()
        if (error) {
          commit('disconnected')
          state.pomelo.disconnect()
          reject(error)
        } else {
          commit('connected')
          resolve()
        }
      }
      const onError = () => finish(new Error('实时监控服务连接失败'))
      const onClose = () => finish(new Error('实时监控服务已断开'))
      state.pomelo.disconnect()
      try {
        state.pomelo.once('io-error', onError)
        state.pomelo.once('close', onClose)
        state.pomelo.once('disconnect', onClose)
        state.pomelo.init(
          {
            proto: state.proto,
            address: state.address,
            log: true,
            reconnect: false,
          },
          function () {
            if (settled) return
            state.pomelo.request(
              'control.entryHandler.entry',
              {
                token: state.token,
              },
              function (data) {
                if (settled) return
                  if (data && data.code === 0) {
                    finish()
                  } else {
                    console.log('connectd error:', data)
                    finish(new Error('实时监控服务登录失败'))
                  }
                }
              )
            }
          )
        } catch (error) {
          finish(error)
        }
    })
  },
}

export default {
  state,
  getters,
  mutations,
  actions,
}
