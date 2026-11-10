/**
 * @description 游戏状态管理
 */
import Vue from 'vue'

const state = () => ({
  roundId: null,
  status: -1, // 游戏状态
  gameStartTime: 0, // 开始时间
  currentMultiple: 0, // 当前倍数
  waitTime: null, // 等待时间
  syncPoint: null, // 初始同步倍数
  betList: [], // 所有下注记录
})
const getters = {
  status: (state) => state.status,
  gameStartTime: (state) => state.gameStartTime,
  currentMultiple: (state) => state.currentMultiple,
  waitTime: (state) => state.waitTime,
  syncPoint: (state) => state.syncPoint,
  betList: (state) => state.betList,
  roundId: (state) => state.roundId,
}
const mutations = {
  updateStatus(state, status) {
    state.status = status
    if (status === 1) {
      state.gameStartTime = Date.now()
    }
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
  initBetList(state, list) {
    state.betList.push(...list)
  },
  resetBetList(state) {
    state.betList.splice(0, state.betList.length)
  },
  addBetList(state, value) {
    if (value.userId > 10000) {
      state.betList.push(value)
    }
  },
  delBetList(state, { userId, index }) {
    const betIndex = state.betList.findIndex(
      (e) => e.userId === userId && e.index === index
    )
    state.betList.splice(betIndex, 1)
  },
  updateBetList(state, { userId, index, multiple, cashOut }) {
    const bet = state.betList.find(
      (e) => e.userId === userId && e.index === index
    )
    if (bet) {
      Vue.set(bet, 'multiple', multiple)
      Vue.set(bet, 'cashOut', cashOut)
    }
  },
  setRoundId(state, value) {
    state.roundId = value
  },
}
const actions = {
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

export default {
  state,
  getters,
  mutations,
  actions,
}
