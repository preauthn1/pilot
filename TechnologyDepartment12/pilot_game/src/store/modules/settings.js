import { getServerConfig, getGameConfig } from '@/api'

/**
 * @description 所有全局配置的状态管理
 */
const state = () => ({
    betAmountList: [2, 5, 10, 20], // 投注额列表
    defaultBet: null, // 默认投注金额
    maxBet: null, // 最大投注金额
    minBet: null, //最小投注金额
    stepBet: 1, //加减按钮幅度
    maxCashOut: null, //最大结算倍数
    minCashOut: null, //最小结算倍数
    currency: null, // 币种
    freeBetEnabled: false, // 免费下注开关
    freeBetAmount: null, // 单次免费下注金额
    freeBetRemain: 0, // 剩余免费次数
    ruleContent: '', // 游戏规则内容
})
const getters = {
    defaultBet: (state) => state.defaultBet,
    maxBet: (state) => state.maxBet,
    minBet: (state) => state.minBet,
    stepBet: (state) => state.stepBet,
    betAmountList: (state) => state.betAmountList,
    maxCashOut: (state) => state.maxCashOut,
    minCashOut: (state) => state.minCashOut,
    currency: (state) => state.currency,
    freeBetEnabled: (state) => state.freeBetEnabled,
    freeBetAmount: (state) => state.freeBetAmount,
    freeBetRemain: (state) => state.freeBetRemain,
    ruleContent: (state) => state.ruleContent,
}
const mutations = {
    setDefaultBet(state, defaultBet) {
        state.defaultBet = defaultBet
    },
    setMaxBet(state, maxBet) {
        state.maxBet = maxBet
    },
    setMinBet(state, minBet) {
        state.minBet = minBet
    },
    setStepBet(state, stepBet) {
        state.stepBet = stepBet
    },
    setAmountList(state, betAmountList) {
        state.betAmountList = betAmountList
    },
    setMaxCashOut(state, maxCashOut) {
        state.maxCashOut = maxCashOut
    },
    setMinCashOut(state, minCashOut) {
        state.minCashOut = minCashOut
    },
    setCurrency(state, currency) {
        state.currency = currency
    },
    setFreeBetEnabled(state, enabled) {
        state.freeBetEnabled = enabled
    },
    setFreeBetAmount(state, amount) {
        state.freeBetAmount = amount
    },
    setFreeBetRemain(state, remain) {
        state.freeBetRemain = remain
    },
    setRuleContent(state, ruleContent) {
        state.ruleContent = ruleContent
    },
}
const actions = {
    async setSettings({ commit }, token) {
        const { data } = await getServerConfig(token)
        if (data) {
            commit('setDefaultBet', data.game.initialBet)
            commit('setMaxBet', data.game.betMax)
            commit('setMinBet', data.game.betMin)
            commit('setStepBet', data.game.amplitude)
            commit('setMaxCashOut', data.game.settlementMax)
            commit('setMinCashOut', data.game.settlementMin)
            commit('setAmountList', data.game.btnBet.split(','))
            commit('setCurrency', data.tag)
            commit('setFreeBetEnabled', data.game.freeBetEnabled === 1)
            commit('setFreeBetAmount', data.game.freeBetAmount)
            commit('setFreeBetRemain', data.game.freeBetRemain || 0)
            commit('setRuleContent', data.game.ruleContent || '')
            return Promise.resolve(data)
        } else {
            return Promise.reject(data.message)
        }

    },

    async UpdateSettings({ commit }) {
        const { data } = await getGameConfig()
        if (data) {
            commit('setDefaultBet', data.initialBet)
            commit('setMaxBet', data.betMax)
            commit('setMinBet', data.betMin)
            commit('setStepBet', data.amplitude)
            commit('setMaxCashOut', data.settlementMax)
            commit('setMinCashOut', data.settlementMin)
            commit('setAmountList', data.btnBet.split(','))
            commit('setRuleContent', data.ruleContent || '')
        } else {
            return Promise.reject(data.message)
        }
    },
}

export default { state, getters, mutations, actions }
