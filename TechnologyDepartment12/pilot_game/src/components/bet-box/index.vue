<template>
  <div class="box" :class="betStatus > 0 ? betStatus === 3 && status === 1 ? 'active cash': 'active' : ''">
    
    <div class="bet-content">
      <van-row type="flex" justify="space-between" align="center" gutter="8">
        <van-col span="24">
             <van-row>
            <van-col span="24">
            <div class="stepper-top">
              <div class="stepper-top-lt">
              <van-stepper
                  v-model="betCountInput"
                  class="stepper num-font"
                  theme="round"
                  :input-width="inputWidth"
                  :min="minBet | numberFormat"
                  :max="maxBet | numberFormat"
                  :step="stepBet"
                  :decimal-length="2"
                  :disabled="betStatus > 0 || useFreeBet"
                  @focus="handleFocus"
                  @change="handleChange"
              />
              </div>
              <div class="stepper-top-rt">
                  <div :class="{'add-btn': id === 1 && value === 1, 'remove-btn': id === 2 && value === 2}" @click="handleAddOrRemove"></div>
              </div>
            </div>
            <div class="amount-list">
              <van-button
                  v-for="(item, index) in betAmountList"
                  :key="index"
                  class="amount-btn"
                  @click="changeBetAmount(item)"
                  :disabled="betStatus > 0 || useFreeBet"
              >
                {{currency}}{{item}}
              </van-button>
            </div>
          </van-col>
        </van-row>
       <van-row>
             <van-col span="24" class="bet-box">
              <div class="bet-btn-wrap">
                  <van-button v-if="betStatus === 0"  class="bet-btn" :class="'betbtn'+betStatus" :disabled="!useFreeBet && availableCoin == 0"  @click="handleBet">{{ useFreeBet ? 'Free Bet' : $t('btn.bet') }}</van-button>
                  <van-button v-if="betStatus === 1" class="bet-btn bet-btn1" type="danger" @click="handleCancel">
                    <div class="btn-text">{{$t('btn.wait')}}</div>
                    <div>{{$t('btn.cancel')}}</div>
                  </van-button>
                  <van-button v-if="betStatus === 2" class="bet-btn" type="primary" disabled>{{$t('btn.bet')}}</van-button>
                  <van-button v-if="betStatus === 3 && status === 0" style="width:100%;" class="bet-btn bet-btnCancel"  type="danger" @click="handleCancel">
                    {{$t('btn.cancel')}}
                  </van-button>
                  <van-button v-if="betStatus === 3 && status === 1" class="bet-btn cash-out-btn" :class="'betbtn'+betStatus"   type="warning" @click="handleCashOut">
                    <span class="cash-out-btn__content">
                      <span>{{$t('btn.cash_out')}}</span>
                      <span class="btn-value num-font">
                        {{currency}}{{cashOutAmount}}
                      </span>
                    </span>
                  </van-button>
              </div>
          </van-col>
       </van-row>
        </van-col>
      </van-row>
      <div class="switch-group">
        <div class="switch-group__item" v-if="freeBetEnabled && freeBetRemain > 0">
          <span>Free Bet({{freeBetRemain}} left)</span>
          <div class="van-switch auto-switch" :class="{'switch--on': useFreeBet}" @click="toggleFreeBet">
            <div class="van-switch__node"></div>
          </div>
        </div>
        <div class="switch-group__item">
          <span>{{$t('game.auto_bet')}}</span>
          <div class="van-switch auto-switch" :class="{'switch--on': autoBet}" @click="changeAutoBet">
            <div class="van-switch__node"></div>
          </div>
        </div>
        <div class="switch-group__item">
          <div>{{$t('game.auto_cash_out')}}</div>
          <div class="van-switch auto-switch" :class="{'switch--on': autoCashOut}" @click="changeAutoCashOut">
            <div class="van-switch__node"></div>
          </div>
        </div>
        <van-field v-model="cashOutMultipleInput" class="cash-out-input num-font" type="number" :disabled="!canEditAutoCashOutMultiple" @blur="handleCashOutMultiple">
          <template #right-icon>
            <van-icon class-prefix="icon-fly" name="clear" size="7" @click="handleClear"></van-icon>
          </template>
        </van-field>
      </div>
    </div>
  </div>
</template>

<script>
import {  mapGetters } from 'vuex'
import {parseTime} from "../../common/util";
import notice from '@/components/popup-model/notice'

export default {
  name: "BetBox",
  props: {
    id: {   // boxID
      type: Number,
      default: 1,
    },
    value: {  // box数量
      type: Number,
      default: 2,
    }
  },
  computed: {
    ...mapGetters({
      pomelo: 'client/pomelo',
      coin: 'user/coin',
      status: 'game/status',
      currentMultiple: 'game/currentMultiple',
      defaultBet: 'settings/defaultBet',
      maxBet: 'settings/maxBet',
      minBet: 'settings/minBet',
      stepBet: 'settings/stepBet',
      betAmountList: 'settings/betAmountList',
      maxCashOut: 'settings/maxCashOut',
      minCashOut: 'settings/minCashOut',
      availableCoin: 'user/availableCoin',
      betInfo: 'user/betInfo',
      currency: 'settings/currency',
      tag:'client/tag',
      freeBetEnabled: 'settings/freeBetEnabled',
      freeBetAmount: 'settings/freeBetAmount',
      freeBetRemain: 'settings/freeBetRemain',
    }),
    // 下注金额(分)
    betCount() {
      let amount = parseInt((this.betCountInput * 100).toFixed(0))
      amount = Math.max(amount, this.minBet)
      amount = Math.min(amount, this.maxBet)
      return amount
    },
    cashOutMultiple() {
      return parseInt((this.cashOutMultipleInput * 100).toFixed(0))
    },
    canEditAutoCashOut() {
      return !this.cashAjax && (this.betStatus === 0 || (this.betStatus === 3 && this.status === 1))
    },
    canEditAutoCashOutMultiple() {
      return this.autoCashOut && this.canEditAutoCashOut
    },
  },
  data() {
    return {
      betCountInput: '',    // 面板下注金额(元)
      cashOutMultipleInput: '',    // 面板自动结算倍数
      autoBet: false,       //  自动下注
      autoCashOut: false,   //  自动结算
      cashOutAmount: 0,     //  金额
      betStatus: 0,         // 下注状态 0-未下注  1-已下注  2-提交中  3-已提交
      betBtnActive: 0, // 被激活的下注按钮
      inputWidth:80,
      cashAjax:false,
      useFreeBet: false,    // 是否使用免费下注
      currentBetFree: false, // 当前注单是否为免费下注
    }
  },
  watch: {
    currentMultiple(val) {
      if (this.betStatus === 3) {
        this.cashOutAmount = ((Math.floor(val / 100 * this.betCount))/100).toFixed(2)
      }
    },
    status(val) {
      if (val === 2) {
        if (this.betStatus === 3) {
          this.betStatus = this.autoBet ? 1 : 0
          this.addMineRecord() // 结束时还未结算
        }
      } else if (val === 0) {
        this.autoBet && this.handleBet()  // 自动下注
        if (this.betStatus === 1) {
          this.betStatus = 2
          this.currentBetFree = this.useFreeBet
          this.pomelo.request('aviator.aviatorHandler.betRequest', {
            index: this.id,
            tag:this.tag,
            betCount: this.betCount,
            auto: this.autoCashOut,
            multiple: this.cashOutMultiple,
            useFreeBet: this.useFreeBet
          }, (data) => {
            if (data.code === 0) {
              if (!this.useFreeBet) {
                this.$store.commit('user/setCoin', data.data.coin)
              } else {
                this.$store.commit('settings/setFreeBetRemain', this.freeBetRemain - 1)
              }
              this.betStatus = 3
            } else {
              console.log(data)
              this.$toast(this.$t('tips.request_fail'))
              this.betStatus = 0
            }
          })
        }
      }
    },
    betInfo(data) {
      const info = data.find(e => e.index === this.id)
      if (!info) return
      this.betCountInput = this.$options.filters['numberFormat'](info.betCount)
      this.autoCashOut = info.auto
      this.cashOutMultipleInput = this.$options.filters['numberFormat'](info.multiple)
      this.betStatus = 3
    },
    freeBetRemain(val) {
      if (val <= 0) {
        this.useFreeBet = false
        this.currentBetFree = false
      }
    },
  },
  created() {
    this.init()
    // 自动cashOut
    this.pomelo.on('autoCashOut', (data) => {
      if(this.id === data.index) {
        this.$store.commit('user/setCoin', data.coin)
        this.$store.commit('game/winSound', true)
        notice({ multiple: data.multiple, coin: data.cashOut, currency: this.currency })
        this.addMineRecord(data.multiple, data.cashOut)  // 结算添加记录
        this.betStatus = this.autoBet ? 1 : 0
      }
    })
    // 修改配置
    this.pomelo.on('config', () => {
      if (this.id === 1) {
        this.$store.dispatch('settings/UpdateSettings').then(() => {
          this.init()
        })
      }
    })
  },
  methods: {
     //获取欧焦点
    handleFocus($event){
      var val = parseInt($event.target._value)+'';
      $event.target.setSelectionRange(0,val.length,'backward')
    },
    handleChange(val){
        // window.num = val;
        if(val.length > 9 && val.length<20){
          this.inputWidth = 150
        }else{
          if(val.length < 10){
            this.inputWidth = 80
          }
        }
    },
    // 初始化
    init() {
      this.cashOutMultipleInput = this.$options.filters['numberFormat'](this.minCashOut)
      this.betCountInput = this.$options.filters['numberFormat'](this.defaultBet)
    },
    // 添加删除下注按钮组件
    handleAddOrRemove() {
      if (this.id === 1 && this.value === 1) {
        // 添加组件
        this.$emit('input', 2)
      }
      if (this.id === 2 && this.value === 2 && this.betStatus === 0) {
        // 删除组件
        this.$emit('input', 1)
      }
    },
    // 修改下注金额
    changeBetAmount(val) {
      if (val === this.betBtnActive) {
        this.betCountInput = +this.betCountInput + (+val)
      } else {
        this.betCountInput = val
      }
      this.betBtnActive = val
    },
    // 切换免费下注
    toggleFreeBet() {
      this.useFreeBet = !this.useFreeBet
      if (this.useFreeBet) {
        this.betCountInput = this.$options.filters['numberFormat'](this.freeBetAmount)
        this.autoCashOut = false
        this.cashOutMultipleInput = this.$options.filters['numberFormat'](this.minCashOut)
      }
    },
    // 确认下注
    handleBet() {
      if (!this.useFreeBet && this.availableCoin < this.betCount) {
        this.$toast(this.$t('tips.bet_fail'))
        this.autoBet = false
        return false
      }
      if (!this.useFreeBet) {
        this.$store.commit('user/setAvailableCoin', this.availableCoin - this.betCount)
      }
      //如果已经可以下注了
      console.log('下注的币种'+this.tag);

      if (this.status === 0) {
        this.betStatus = 2
        this.currentBetFree = this.useFreeBet
        this.pomelo.request('aviator.aviatorHandler.betRequest', {
          index: this.id,
          tag:this.tag,
          betCount: this.betCount,
          auto: this.autoCashOut,
          multiple: this.cashOutMultiple,
          useFreeBet: this.useFreeBet
        }, (data) => {
          if (data.code === 0) {
            if (!this.useFreeBet) {
              this.$store.commit('user/setCoin', data.data.coin)
            } else {
              this.$store.commit('settings/setFreeBetRemain', this.freeBetRemain - 1)
            }
            this.betStatus = 3
          } else {
            // 下注失败
            this.$toast(data.msg)
            this.betStatus = 0
            this.autoBet = false
          }
        })
      } else {
        this.betStatus = 1
      }
    },
    // 取消下注
    handleCancel() {
      if (this.betStatus === 0) {
        console.log('bet status 0,can handle cancel ?')
        return
      }
      this.autoBet = false  // 取消自动下注
      // 还未提交
      if (this.betStatus === 1) {
        this.$store.commit('user/setAvailableCoin', this.availableCoin + this.betCount)
        this.betStatus = 0
      } else if (this.betStatus === 2 || this.betStatus === 3) {
        this.pomelo.request('aviator.aviatorHandler.cancelRequest', {index: this.id}, (data) => {
          if (data.code === 0) {
            if (this.currentBetFree) {
              this.$store.commit('settings/setFreeBetRemain', this.freeBetRemain + 1)
            }
            this.$store.commit('user/setCoin', data.data.coin)
            this.betStatus = 0
          }  else {
            console.log(data.code)
          }
        })
      }
    },
    // 结算
    handleCashOut() {
    //  console.log('点解了');
      if (this.betStatus !== 3 || this.status !== 1) {
        return
      }
    //  console.log('到这里111');
       if(this.cashAjax) return;
     //  console.log('到这里2222');
      this.betStatus = this.autoBet ? 1 : 0
      this.cashAjax = true;
      this.pomelo.request('aviator.aviatorHandler.cashOutRequest', {index: this.id,tag:this.tag}, (data) => {
        console.log(data)
        if (data.code === 0) {
      //    console.log('成功执行了');
          this.$store.commit('game/winSound', true)
          notice({ multiple: data.data.multiple, coin: data.data.cashOut, currency: this.currency })
          this.$store.commit('user/setCoin', data.data.coin)
          this.addMineRecord(data.data.multiple, data.data.cashOut)  // 结算添加记录
          // this.betStatus = this.autoBet ? 1 : 0
          this.cashAjax = false;
        }  else {
          this.cashAjax = false;
          // console.log('失败执行了');
          console.log(data.code)
        }
      })
    },
    // 游戏中修改 Auto Cash Out 时同步到服务端；若已达到目标倍率，服务端会立即结算。
    syncAutoCashOutSetting() {
      if (this.betStatus !== 3 || this.status !== 1 || this.cashAjax) return
      this.cashAjax = true
      this.pomelo.request('aviator.aviatorHandler.updateAutoCashOutRequest', {
        index: this.id,
        auto: this.autoCashOut,
        multiple: this.autoCashOut ? this.cashOutMultiple : 0
      }, (data) => {
        if (data.code !== 0) {
          console.log(data)
          this.cashAjax = false
          return
        }
        if (data.data && data.data.settled) {
          this.$store.commit('game/winSound', true)
          notice({ multiple: data.data.multiple, coin: data.data.cashOut, currency: this.currency })
          this.$store.commit('user/setCoin', data.data.coin)
          this.addMineRecord(data.data.multiple, data.data.cashOut)
          this.betStatus = this.autoBet ? 1 : 0
        }
        this.cashAjax = false
      })
    },
    // 添加一条下注记录
    addMineRecord(multiple, cashOut) {
      const hasSettlement = multiple !== undefined && cashOut !== undefined
      // 自动结算且已达到结算倍数
      if (!hasSettlement && this.autoCashOut && this.currentMultiple > this.cashOutMultiple) {
        multiple = this.cashOutMultiple
        cashOut = this.betCount * this.cashOutMultiple / 100
      }
      this.$store.commit('record/addMineList', {
        date: parseTime(Date.now()),
        betCount: this.betCount,
        multiple: multiple !== undefined ? multiple : this.currentMultiple,
        cashOut: cashOut !== undefined ? cashOut : 0,
        tag:this.tag
      })
    },
    // 清除自动结算倍数
    handleClear() {
      if (!this.canEditAutoCashOutMultiple) return false
      this.cashOutMultipleInput = this.$options.filters['numberFormat'](this.minCashOut)
      this.syncAutoCashOutSetting()
    },
    // 自动下注开关
    changeAutoBet() {
      if (this.betStatus > 0) return false  // 下注之后不能操作
      this.autoBet = !this.autoBet
      this.autoBet && this.handleBet()
    },
    // 自动结算开关
    changeAutoCashOut() {
      if (this.betStatus === 3 && this.status === 1) {
        if (this.cashAjax) return false
        this.autoCashOut = !this.autoCashOut
        this.syncAutoCashOutSetting()
        return
      }
      if (this.betStatus > 0) return false  // 下注之后不能操作
      this.autoCashOut = !this.autoCashOut
    },
    // 自动结算倍数处理
    handleCashOutMultiple() {
      let multiple = parseInt((this.cashOutMultipleInput * 100).toFixed(0))
      multiple = Math.max(multiple, this.minCashOut)
      multiple = Math.min(multiple, this.maxCashOut)
      this.cashOutMultipleInput = this.$options.filters['numberFormat'](multiple)
      this.syncAutoCashOutSetting()
    },
  }
}
</script>
<style scope>
  .stepper-top{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom:15px;
  }
 
   /* .stepper-top-t{
      padding-right: 12px;
   } */
  .bet-box{
    width:100%;
    margin-top:20px;
  }
  .bet-btn-wrap{
    width:100%;
  }
  .cash-out-btn__content{
    width:100%;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    white-space:nowrap;
    overflow:hidden;
  }
 .bet-box .betbtn0{
    border-radius: 10px;
    /* background-image: linear-gradient(-78deg, #5981F7, #3FBBFE, #A541FF, #7C55FF); */
     background-image: linear-gradient(-78deg, #197d4d, #82ee73, #e5dc34, #65b82d);
    background-size: 400%;
		animation: bganimation 8s infinite;
    color:#fff;
  }
   .bet-box .betbtn3{
    border-radius: 10px;
   }
   @keyframes bganimation {
			0%{
				background-position: 0% 50%;
			}
			50%{
				background-position: 100% 50%;
			}
			100%{
				background-position: 0% 50%;
			}
		}
</style>