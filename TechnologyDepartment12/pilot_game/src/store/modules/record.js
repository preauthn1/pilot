/**
 * @description 下注记录
 */
import Vue from 'vue'

const state = () => ({
    historyList: [], // 历史倍数记录
    betList: [], // 所有下注记录
    mineList: [], // 我的下注记录
    rankList: [], // 排行列表
})
const getters = {
    historyList: (state) => state.historyList,
    betList: (state) => state.betList,
    mineList: (state) => state.mineList,
    rankList: (state) => state.rankList,
}
const mutations = {
    addHistoryList(state, value) {
        if(state.historyList.length === 30) {
            state.historyList.pop()
        }
        state.historyList.unshift({id: Date.now(), value: value})
    },
    setHistoryList(state, list) {
        list = list.reverse().slice(0, 30)
        state.historyList = list.map((item, index) => {
            return {id: Date.now() - index - 1, value: item}
        })
    },
    setAllList(state, value) {
        if (Array.isArray(value)) {
            state.allList = value
        } else {
            state.allList.push(value)
        }
    },
    setMineList(state, list) {
        state.mineList.splice(0, state.mineList.length)
        state.mineList.push(...list)
    },
    addMineList(state, value) {
        state.mineList.unshift(value)
    },
    setRankList(state, list) {
        state.rankList.push(...list)
    },
    initBetList(state, list) {
        list.map(e => {
            e.cashOut = e.cashOut ? (e.betCount * e.multiple / 100).toFixed(2) : 0
        })
        state.betList.push(...list)
    },
    resetBetList(state) {
        state.betList.splice(0, state.betList.length)
    },
    addBetList(state, value) {
        state.betList.push(value)
    },
    delBetList(state, {userId, index}) {
        const betIndex = state.betList.findIndex(e => e.userId === userId && e.index === index)
        state.betList.splice(betIndex, 1)
    },
    updateBetList(state, {userId, index, multiple, cashOut}) {
        const bet = state.betList.find(e => e.userId === userId && e.index === index)
        if (bet) {
            Vue.set(bet, 'multiple', multiple)
            Vue.set(bet, 'cashOut', cashOut)
        }
    }
}
const actions = {
    addHistoryList({ commit }, value) {
        commit('addHistoryList', value)
    },
    setHistoryList({ commit }, list) {
        commit('setHistoryList', list)
    },
    setMineList({ commit }, list) {
        commit('setMineList', list)
    },
}

export default { state, getters, mutations, actions }
