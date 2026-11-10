import { mapGetters } from 'vuex'
import { monitorLogin } from '@/api/monitor'
var gameEvent = {}
export default {
  data() {
    return {
      overlay: true,
      winOrLoss: 0,
      connecting: false,
    }
  },
  computed: {
    ...mapGetters({
      pomelo: 'client/pomelo',
    }),
  },
  created() {
    this.removeEvent()
    // 监听事件
    gameEvent = {
      status: (data) => {
        this.$store.commit('game/updateStatus', data.status)
        this.$store.commit('game/setWaitTime', data.duration || 0)
        if (data.status === 0) {
          this.$store.commit('game/setRoundId', data.roundId)
        } else if (data.status === 2 && data.endPoint) {
          this.$store.commit('game/updateMultiple', data.endPoint)
        }
      },
      syncPoint: (data) => {
        this.$store.commit('game/updateMultiple', data.multiple)
      },
      bet: (data) => {
        this.$store.commit('game/addBetList', data)
      },
      cancel: (data) => {
        this.$store.commit('game/delBetList', data)
      },
      cashOut: (data) => {
        this.$store.commit('game/updateBetList', data)
      },
    }
    this.pomelo.on('disconnect', () => {
      if (!this.connecting && !this.$store.state.client.connected) {
        this.removeEvent()
      } else {
      }
    })
  },
  mounted() {
    this.monitorLogin2()
  },
  methods: {
    addEvent() {
      this.pomelo.on('status', gameEvent.status)
      this.pomelo.on('syncPoint', gameEvent.syncPoint)
      this.pomelo.on('bet', gameEvent.bet)
      this.pomelo.on('cancel', gameEvent.cancel)
      this.pomelo.on('cashOut', gameEvent.cashOut)
    },
    removeEvent() {
      this.pomelo.off('status', gameEvent.status)
      this.pomelo.off('syncPoint', gameEvent.syncPoint)
      this.pomelo.off('bet', gameEvent.bet)
      this.pomelo.off('cancel', gameEvent.cancel)
      this.pomelo.off('cashOut', gameEvent.cashOut)
      this.$store.commit('client/disconnected')
      this.$store.commit('game/resetBetList', {})
      this.$store.commit('game/updateStatus', -1)
    },
    monitorLogin2() {
      this.connecting = true
      monitorLogin()
        .then((response) => {
          const token = response.data.token
          this.winOrLoss = +response.data.winOrLoss
          this.$store.commit('client/setToken', token)
          this.removeEvent()
          this.addEvent()
          this.$store
            .dispatch('client/connect')
            .then(() => {
              console.log('connection succeeded')
            })
            .catch((e) => {
              console.log(e)
              this.removeEvent()
              this.$message.error(e.message || '实时监控服务连接失败')
            })
            .finally(() => {
              this.connecting = false
              this.overlay = false
            })
        })
        .catch(() => {
          this.connecting = false
          this.overlay = false
          this.token = ''
          this.$alert('tokenfill')
        })
    },
  },
}
