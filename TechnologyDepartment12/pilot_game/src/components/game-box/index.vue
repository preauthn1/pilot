<template>
  <div class="game-box">
    <div class="plane-wrapper"></div>
    <div class="game-wrapper">
      <div v-if="status === gameState.ready" class="game-timer">
        <div>{{$t('game.wait')}}</div>
        <div class="countdown num-font">
          {{showTime | timeFormat}}
          <van-progress class="progress" :percentage="percentage" :show-pivot="false" />
        </div>
      </div>
      <div v-if="status === gameState.start" class="game-start">
        <div :style="gameStartStyle">{{showNumber | numberFormat}}<span>x</span></div>
      </div>
      <div v-if="status === gameState.end"  class="game-end">
        <div class="game-end__text">{{$t('game.end')}}</div>
        <div class="game-end__value">{{currentMultiple | numberFormat}}<span>x</span></div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Game from "@/common/game"
import config from '@/common/config'
// import countDown from '../count-down/countDown'
export default {
  name: "GameBox",
   components: {
    // countDown
  },
  computed: {
    ...mapGetters({
      status: 'game/status',
      waitTime: 'game/waitTime',
      currentMultiple: 'game/currentMultiple',
      openGame: 'game/openGame'
    }),
    num() {
      return 100 / (this.waitTime / this.ms)
    },
    gameNum(){
      return this.handleColor(this.showNumber)
    },
    gameStartStyle() {
      const color = this.gameNum
      return {
        transition: `all 1s ease`,
        textShadow: `0 0 6px ${color}, 0 0 14px ${color}, 0 0 26px ${color}, 0 0 38px ${color}`
      }
    },
  },
  // watch:{
  //   openGame(){
       
  //   }
  // },
  data() {
    return {
      gameState: config.gameState,
      percentage: 0,
      ms: 100,
      showNumber: 100,
      showTime: 0,
      istart:false,

       fire: 0,
      tiping: {
        text: this.$t('game.countdown'),
        color: '#fff'
      },
      tipend: {
        text: this.$t('game.start'),
        color: '#fff'
      },
      bgCir:'rgba(0,0,0,0.3)',
      game: null
    }
  },
  filters: {
    timeFormat: function (value) {
      let s = Math.floor(value / 1000)
      let m = Math.floor(s / 60)
      m = m < 10 ? '0'+ m : m
      s = s < 10 ? '0'+ s : s
      return `${m}:${s}`
    },
  },
  mounted() {
    // 创建动画
    this.game = new Game(this.$el.getElementsByClassName('plane-wrapper')[0])
   
  },
  beforeDestroy() {
    if (this.game) {
      this.game.destroy()
      this.game = null
    }
  },
  watch: {
    status(val) {
      if (val === this.gameState.ready) {
           this.showTime = this.waitTime + 1000
            this.changePercentage() // 加载进度条
            this.gsap.to(this.$data, {duration: this.waitTime / 1000, showTime: 0, ease: 'none'}) // 倒计时
            this.showNumber = 100 // 游戏开始，倍数重置
              // 启动倒计时
          this.fireCD()
      }
    },
    currentMultiple(newVal) {
     this.gsap.to(this.$data, {duration: 0.5, showNumber: newVal}) // 数字滚动动画
    }
  },
  methods: {
    handleColor(value) {
      return value < 200 ? '#3df2ff' : value < 500 ? '#3df2ff' : value < 1000 ? '#FDAD14' : 'red';
    },
    fireCD () {
      // 配置参数（更多配置如下表）
      // this.tiping = {
      //   text: '',
      //   color: '#fff'
      // }
      // this.tipend = {
      //   text: '',
      //   color: '#fff'
      // }

      // 启动倒计时(效果如上图所示)      
      // 也支持：this.$refs.countDown.startCd()方式 启动倒计时
      this.fire++ 
    },
    onStatusChange () {
     // console.log('倒计时状态改变：', payload)
    },
    onEnd () {
      //console.log('倒计时结束的回调函数')
    },
    changePercentage() {
      this.percentage = 0
      let timer = setInterval(() => {
        if (this.percentage < 100) {
          const tmp = this.percentage + this.num
          this.percentage = tmp > 100 ? 100 : tmp
        }
        if (this.percentage >= 100) {
          clearInterval(timer)
        }
      }, this.ms)
    },
  },
}
</script>

<style scoped>
      .container-time{
            display:flex;
            position: relative;
           margin-top:30px;
      } 
      .time-game-box{
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        width:100%;height: 100%;
      }

        .left-time{
            width: 69px;
            height: 140px;
            position: relative;
            overflow: hidden;
          
            margin-right: -1px;
            z-index: 3;
        }

        .leftcircle-time{
            width: 120px;
            height: 120px;
            border: 10px solid white;
            position: absolute;
            border-radius: 50%;
            left: 0px;
            top:0px;
            border-bottom: 10px solid #7C55FF;
            border-left: 10px solid #7C55FF;
            border-color: linear-gradient(-78deg, #5981F7, #3FBBFE, #A541FF, #7C55FF);
            transform: rotate(45deg);
        }
        .leftcircle-start{
            animation-name:circle_left;
            animation-duration: 5s;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
        }
        .rightcircle-start{
            animation-name: circle_right;
            animation-duration: 5s;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
        }

        .right-time {
            width: 70px;
            height: 140px;
            position: relative;
            overflow: hidden;
            z-index: 2;
        }

        .rightcircle-time {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 10px solid white;
            position: absolute;
            border-top: 10px solid #7C55FF;
            border-right: 10px solid #7C55FF;
            border-color: linear-gradient(-78deg, #5981F7, #3FBBFE, #A541FF, #7C55FF);
            right: 0px;
            top: 0px;
           
            transform: rotate(-135deg);
        }

        @keyframes circle_right {
            0% {
                transform: rotate(-135deg);
            }

            50%,100% {
                transform: rotate(45deg);
            }
        }
        @keyframes circle_left {
            0%,50% {
                transform: rotate(-135deg);
            }

            100% {
                transform: rotate(45deg);
            }
        }



.round{
    width:140px;
    height: 140px;
    /* background: url(../../assets/image/round.png);
    background-repeat: no-repeat; */
    background-size: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-top:-30px;
    position: absolute;
    top:0px;
    left:50px;
  }
  .round .line{
    position: absolute;
    bottom:50px;
    margin:0 auto;
    width:60%;
    height: 2px;
    background: #A59AC6;
  }
  .game-start .txt{
    font-weight: bold;
    color: #FDAD14;
    font-size:28px;
  }
</style>
