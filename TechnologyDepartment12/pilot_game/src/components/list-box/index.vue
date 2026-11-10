<template>
  <div class="list-box">
    <van-tabs v-model="active" type="card" title-inactive-color="#ffffff" class="list-tabs">
      <van-tab :title="$t('game.all')"></van-tab>
      <van-tab :title="$t('game.mine')"></van-tab>
      <van-tab :title="$t('game.rank')"></van-tab>
    </van-tabs>
    <div class="list-content">
      <div v-if="active === 0" class="list-header__all">
        <div>{{ $t('game.total_bet') }}: <span class="text num-font">{{ totalBets | numberFormat }}</span></div>
        <van-button class="list-header__btn" @click="handlePreRound">
          {{ isPreviousRound ? $t('game.current_round') : $t('game.previous_round') }}
        </van-button>
      </div>
      <div v-if="active === 2" class="list-header__rank">
        <van-button class="list-header__btn" :class="{ 'list-header__btn--active': rankSort === 1 }"
          @click="handleCashOut">
          {{ $t('game.cash_out_btn') }}
        </van-button>
        <van-button class="list-header__btn" :class="{ 'list-header__btn--active': rankSort === 2 }"
          @click="handleMultiple">
          {{ $t('game.multiple_btn') }}
        </van-button>
      </div>
      <div class="list-table">
        <van-row class="thead">
          <van-col v-if="active === 1" span="6">{{ $t('game.date') }}</van-col>
          <van-col v-else span="5">{{ $t('game.player') }}</van-col>
          <van-col span="6">{{ $t('game.bet') }}</van-col>
          <van-col span="6">{{ $t('game.multiple') }}</van-col>
          <van-col v-if="active === 1" span="6">{{ $t('game.cash_out') }}</van-col>
          <van-col v-else span="7">{{ $t('game.cash_out') }}</van-col>
        </van-row>
        <div class="tbody" :class="'tbody' + active">
          <van-loading v-show="loading" class="list-loading"></van-loading>
          <van-row v-for="(item, index) in list" :key="index" type="flex" align="center"
            :class="{ win: active < 2 && item.cashOut > 0 }">
            <van-col v-if="active === 1" span="6">
              <div class="list-item-user">{{ item.date | timeFormat }}</div>
            </van-col>
            <van-col v-else span="5">
              <div class="list-item-user">{{ item.username }}</div>
            </van-col>
            <van-col span="6"><!----{{currency}}-->
              {{ item.tag }}{{ item.betCount | numberFormat }}
            </van-col>
            <van-col span="6" v-if="item.cashOut > 0">
              <span v-if="active === 2 && rankSort === 1">{{ item.multiple | numberFormat }}x</span>
              <van-tag v-else class="list-item-tag" :color="handleColor(item.multiple)">{{ item.multiple |
                numberFormat}}x</van-tag>
            </van-col>
            <van-col span="6" v-else>
              <span v-if="item.multiple > 0" style="color:red;">{{ item.multiple | numberFormat }}x</span>
              <span v-else>{{ item.multiple | numberFormat }}x</span>
            </van-col>
            <van-col span="6" v-if="active === 1">
              <span v-if="item.cashOut > 0"><!--{{currency}}-->
                {{ item.tag }}{{ item.cashOut | numberFormat }}
              </span>
              <span v-else>0</span>
            </van-col>
            <van-col span="7" v-else-if="item.cashOut > 0">
              <van-tag v-if="active === 2 && rankSort === 1" class="list-item-tag-coin"><!---{{currency}}-->
                {{ item.tag }}{{ item.cashOut | numberFormat }}
              </van-tag>
              <span v-else><!---{{currency}}-->
                {{ item.tag }}{{ item.cashOut | numberFormat }}
              </span>
            </van-col>
            <van-col span="7" v-else>0</van-col>
          </van-row>
        </div>

      </div>
    </div>
  </div>

</template>

<script>
import { mapGetters } from 'vuex'
import { parseTime2 } from '@/common/util'

export default {
  name: "ListBox",
  computed: {
    ...mapGetters({
      pomelo: 'client/pomelo',
      betList: 'record/betList',
      mineList: 'record/mineList',
      rankList: 'record/rankList',
      currency: 'settings/currency',
    }),
    totalBets() {
      let list = this.isPreviousRound ? this.list : this.betList
      return list.reduce((total, value) => {
        return total + value.betCount
      }, 0)
    },
  },
  data() {
    return {
      active: 0,
      isPreviousRound: false,
      rankSort: 1, // 1-cash out 2-multiple
      value: '',
      list: [],
      loading: false,
    }
  },
  filters: {
    timeFormat: function (value) {
      return parseTime2(value)
    },
  },
  watch: {
    active(val) {
      switch (val) {
        case 0: this.list = this.betList
          break;
        case 1: this.getMineList()
          break;
        case 2: this.handleCashOut()
          break;
        default: this.list = []
      }
    },
  },
  created() {
    this.list = this.betList
  },
  methods: {
    getMineList() {
      this.loading = true
      this.list = []
      this.pomelo.request('hall.gameHandler.userRecord', {}, (data) => {
        if (data.code === 0) {
          this.$store.dispatch('record/setMineList', data.data).then(() => {
            this.list = this.mineList
          })
        }
        this.loading = false
      })
    },
    // 切换上一回合数据
    handlePreRound() {
      this.isPreviousRound = !this.isPreviousRound
      if (this.isPreviousRound) {
        this.loading = true
        this.pomelo.request('hall.gameHandler.previousRecord', {}, (data) => {
          if (data.code === 0) {
            this.list = data.data
          }
          this.loading = false
        })
      } else {
        this.list = this.betList
      }
    },
    handleCashOut() {
      this.rankSort = 1
      this.list = []
      this.loading = true
      this.pomelo.request('hall.gameHandler.cashOutRank', {}, (data) => {
        if (data.code === 0) {
          this.list = data.data
        }
        this.loading = false
      })
    },
    handleMultiple() {
      this.rankSort = 2
      this.list = []
      this.loading = true
      this.pomelo.request('hall.gameHandler.multipleRank', {}, (data) => {
        if (data.code === 0) {
          this.list = data.data
        }
        this.loading = false
      })
    },
    handleColor(value) {
      return value < 200 ? '#3df2ff' : value < 500 ? '#1692c1' : value < 1000 ? '#FFCD45' : '#c19020'
    }
  },
}
</script>
<style scope>
.van-tabs__wrap {
  height: auto !important;
}

/* ========= 修复宽度 = 0 + 超出问题 ========= */
.list-content {
  width: 100% !important;
  /* 关键1：宽度100% */
  flex: 1 !important;
  /* 关键2：填满flex父容器 */
}

.tbody {
  overflow-y: auto;
  /* 滚动 */
  width: 100%;
  /* 宽度铺满 */
}
</style>
