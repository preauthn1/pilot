<template>
  <div class="app-container">
    <el-row v-loading="overlay">
      <el-col :span="12">
        <div style="padding-bottom: 20px">
          <!-- <df-button :data="[0 / 100]">在线人数</df-button> -->
          <df-button
            :data="[winOrLoss / 100]"
            :type="winOrLoss < 0 ? 'danger' : 'success'"
          >
            今日平台盈亏
          </df-button>
          <df-button :data="[totalBets / 100]">投注金额</df-button>
          <!-- <df-button :data="[0 / 100]">当前飞机倍数</df-button> -->
          <df-button
            :data="[totalProfit / 100]"
            :type="totalProfit < 0 ? 'danger' : ''"
          >
            预计平台盈利
          </df-button>
          <!-- <df-button :data="[0 / 100]">游戏状态</df-button> -->
          <el-button
            type="primary"
            style="margin-left: 30px; width: 150px; height: 50px"
            :disabled="status !== 1 || settlementLoading"
            :loading="settlementLoading"
            @click="settlement"
          >
            <span style="font-size: medium">立即结算</span>
          </el-button>
        </div>
        <div class="game-box">
          <div class="plane-wrapper"></div>
          <div class="game-wrapper">
            <div v-if="status === -1" class="game-timer">
              <div>游戏加载中...</div>
            </div>
            <div v-if="status === 0" class="game-timer">
              <div>WAITING FOR NEXT ROUND</div>
              <div class="countdown num-font">
                {{ showTime | timeFormat }}
              </div>
            </div>
            <div v-if="status === 1" class="game-start">
              <div>
                {{ showNumber | numberFormat }}
                <span>x</span>
              </div>
            </div>
            <div v-if="status === 2" class="game-end">
              <div class="game-end__text">FLEW FLAY</div>
              <div class="game-end__value">
                {{ currentMultiple | numberFormat }}
                <span>x</span>
              </div>
            </div>
          </div>
        </div>
        <div class="connection">
          <el-button
            :type="connected ? 'success' : 'danger'"
            icon="el-icon-connection"
            round
          >
            {{ connected ? '已连接' : '断开连接' }}
          </el-button>
        </div>
      </el-col>
      <el-col :span="12">
        <el-table
          highlight-current-row
          border
          max-height="704"
          :data="betList"
          style="width: 100%"
        >
          <!-- <el-table-column prop="createdAt" label="商户" />
            <el-table-column prop="roundId" label="渠道" /> -->
          <el-table-column prop="username" label="玩家账号" />
          <!-- <el-table-column
              prop="result"
              label="总盈亏"
              :formatter="$util.fenToYuan"
            />
            <el-table-column
              prop="result"
              label="今日盈亏"
              :formatter="$util.fenToYuan"
            /> -->
          <!-- <el-table-column
              prop="result"
              label="自动投注倍数"
              :formatter="$util.fenToYuan"
            /> -->
          <el-table-column
            prop="betCount"
            label="投注金额"
            :formatter="$util.fenToYuan"
          />
          <el-table-column
            prop="multiple"
            label="玩家结算倍数"
            :formatter="$util.fenToYuan"
          />
          <el-table-column prop="cashOut" label="本局派彩">
            <template slot-scope="scope">
              <span :style="{ color: scope.row.cashOut > 0 ? '#67C23A' : '' }">
                {{ scope.row.cashOut | numberFormat }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="profit" label="玩家本局盈亏">
            <template slot-scope="scope">
              {{
                ((scope.row.cashOut || 0) - scope.row.betCount) | numberFormat
              }}
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'
  import { realTimeSettlement } from '@/api/monitor'
  import Game from './game'
  import Mixin from './mixin'
  import gsap from 'gsap'

  export default {
    name: 'RealTimeMonitoring',
    filters: {
      timeFormat: function (value) {
        let s = Math.floor(value / 1000)
        let m = Math.floor(s / 60)
        m = m < 10 ? '0' + m : m
        s = s < 10 ? '0' + s : s
        return `${m}:${s}`
      },
      numberFormat: function (value) {
        return ((+value || 0) / 100).toFixed(2)
      },
    },
    mixins: [Mixin],
    data() {
      return {
        percentage: 0,
        ms: 100,
        showNumber: 100,
        showTime: 0,
        totalBets: 0,
        totalProfit: 0,
        settlementLoading: false,
        flyerTimer: null,
      }
    },
    computed: {
      ...mapGetters({
        connected: 'client/connected',
        roundId: 'game/roundId',
        status: 'game/status',
        waitTime: 'game/waitTime',
        currentMultiple: 'game/currentMultiple',
        betList: 'game/betList',
        extra: 'settings/extra',
        visitedRoutes: 'tabs/visitedRoutes',
      }),
      num() {
        return 100 / (this.waitTime / this.ms)
      },
    },
    watch: {
      status(val) {
        if (val === 0) {
          this.$store.commit('game/resetBetList', {})
          this.showTime = this.waitTime + 1000
          // this.changePercentage() // 加载进度条
          gsap.to(this.$data, {
            duration: this.waitTime / 1000,
            showTime: 0,
            ease: 'none',
          }) // 倒计时
          this.showNumber = 100 // 游戏开始，倍数重置
          this.totalBets = 0
          this.totalProfit = 0
        } else if (val === 2) {
          // 游戏结束
          this.winOrLoss += this.totalProfit
        }
      },
      currentMultiple(newVal) {
        gsap.to(this.$data, { duration: 1, showNumber: newVal }) // 数字滚动动画
      },
      betList(newVal) {
        this.totalBets = 0
        this.totalProfit = 0
        newVal.map((v) => {
          this.totalBets += v.betCount
          this.totalProfit += v.betCount - (v.cashOut || 0)
        })
      },
      $route: {
        handler(val, oldval) {
          val.name == 'realTimeMonitoring'
            ? this.setRefeshaRoute()
            : clearInterval(this.flyerTimer)
        },
        // 深度观察监听
        deep: true,
      },
    },
    mounted() {
      // 创建动画
      this.initGame()
      this.setRefeshaRoute()
    },
    activated() {
      // keep-alive 激活时重新创建游戏动画（WebGL 上下文在组件不可见时丢失）
      this.initGame()
      // 重新建立实时监控连接
      this.monitorLogin2()
      // 恢复定时刷新
      this.setRefeshaRoute()
    },
    deactivated() {
      // keep-alive 缓存时销毁游戏实例，释放资源
      this.destroyGame()
      clearInterval(this.flyerTimer)
      // 断开 pomelo 连接，确保下次激活时干净重连
      this.removeEvent()
      this.pomelo.disconnect()
    },
    destroyed() {
      clearInterval(this.flyerTimer)
      this.flyerTimer = null
      this.destroyGame()
      this.pomelo.disconnect()
    },
    methods: {
      initGame() {
        this.destroyGame()
        this.gameInstance = new Game(
          document.getElementsByClassName('plane-wrapper')[0]
        )
      },
      destroyGame() {
        if (this.gameInstance) {
          this.gameInstance.destroy()
          this.gameInstance = null
        }
      },
      //定时刷新当前页
      setRefeshaRoute() {
        clearInterval(this.flyerTimer)
        this.flyerTimer = setInterval(() => {
          this.refreshRoute()
          // location.reload();
        }, 300000)
      },
      async refreshRoute() {
        const currentRoute = this.$route
        const parentRouteName = currentRoute.matched
          .slice(0, -1)
          .map((item) => item.name)
          .join(',')
        const otherRoutes = this.visitedRoutes.filter((item) => {
          return item.name !== currentRoute.name
        })
        if (otherRoutes.length) {
          let transferRoute = otherRoutes.find((item) => {
            return item.matched.slice(0, -1).join(',') === parentRouteName
          })
          if (!transferRoute) transferRoute = otherRoutes[0]
          this.extra.transferRouteName = currentRoute.name
          this.$router
            .replace(transferRoute)
            .then(() => {
              this.extra.transferRouteName = ''
              this.$router.replace(currentRoute)
            })
            .catch(() => {
              this.$message.success('刷新失败')
            })
        } else this.$baseEventBus.$emit('reload-router-view')
      },
      async settlement() {
        if (!this.roundId) {
          this.$message({
            type: 'error',
            message: '获取游戏roundID失败',
          })
          return
        }
        this.settlementLoading = true
        try {
          await realTimeSettlement({ roundId: this.roundId })
          this.$message.success('立即结算成功')
        } catch (e) {
          this.$message.error(e.message || e || '立即结算失败')
        } finally {
          this.settlementLoading = false
        }
      },
    },
  }
</script>
<style lang="scss" scoped>
  .connection {
    width: 590px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
  }

  .game-box {
    width: 590px;
    height: 271px;
    border-radius: 14px;
    position: relative;
    margin-bottom: 10px;
  }

  .plane-wrapper {
    width: 100%;
    height: 100%;
  }

  .game-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .fun-mode {
      position: absolute;
      top: 1px;
      background-color: #41a1ac;
      border-radius: 0px 0px 6px 6px;
      text-align: center;
      font-size: 11px;
      color: white;
      padding: 4px 16px;
    }

    .game-timer {
      position: absolute;
      display: flex;
      flex-direction: column;
      color: #ffffff;
      text-align: center;
      justify-content: center;
      align-items: center;
      font-size: 20px;

      .countdown {
        width: 158px;
        height: 52px;
        font-size: 40px;
        line-height: 52px;
        color: #3df2ff;
        text-align: center;
      }

      .progress {
        border-radius: 55px;
      }
    }

    .game-start {
      height: 112px;
      width: 100%;
      font-family: RobotoBlack;
      font-size: 75px;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      span {
        margin-left: 12px;
      }
    }

    .game-end {
      height: 112px;
      width: 100%;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;

      &__text {
        position: absolute;
        top: -6px;
        color: white;
        font-size: 20px;
      }

      &__value {
        font-family: RobotoBlack;
        font-size: 75px;
        color: #3effab;

        span {
          margin-left: 12px;
        }
      }
    }
  }
</style>
