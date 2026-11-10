<template>
  <div class="home">
    <el-card class="recharge-card1" shadow="hover">
      <template #header>
        <span>
          <!--          <vab-icon icon="shopping-cart-line" />-->
          今日盈亏
        </span>
      </template>
      <el-row v-for="(val, key , i) in tag" :key="key">
        <el-row style="margin-top: -30px">
          <el-col :span="24">
            <span>
              <h1>
               {{key}}
                <vue-count-to
                  :decimals="loginCount.decimals"
                  :duration="loginCount.duration"
                  :end-val=(val.todayWinLows/100)
                  :separator="loginCount.separator"
                  :start-val="loginCount.startVal"
                  :suffix="loginCount.suffix"
                />
              </h1>
            </span>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="14">
            总盈亏
            <vue-count-to
              :decimals="totalWinLost.decimals"
              :duration="totalWinLost.duration"
              :end-val=(val.totalWinLows/100)
              :separator="totalWinLost.separator"
              :start-val="totalWinLost.startVal"
              :suffix="totalWinLost.suffix"
            />
          </el-col>
        </el-row>
      </el-row>
    </el-card>
  </div>
</template>
<script>
  import VueCountTo from 'vue-count-to'

export default {
  components: { VueCountTo },
    data() {
      return {
        tag: [],
        loginCount: {
          startVal: 0,
          endVal: 0,
          endVal1: 0,
          decimals: 2,
          prefix: '',
          suffix: '',
          separator: ',',
          duration: 1000,
        },
        totalWinLost: {
          startVal: 0,
          endVal: 0,
          endVal1: 0,
          decimals: 2,
          prefix: '',
          suffix: '',
          separator: ',',
          duration: 1000,
        },
        weekRatio: 0,
        dayRatio: 0,
        exchangeRate: 0,
      }
    },
    methods: {
      showWinLost(data) {
        this.tag = data
      },
    },
  }
</script>
<style lang="scss" scoped>
  //.recharge {
  //  &-card1 {
  //    height: 174px;
  //
  //    //&-content {
  //    //  text-align: center;
  //    //}
  //  }
  //
  //  margin-bottom: $base-margin;
  //}
</style>
