<template>
  <div class="home">
    <el-card class="recharge-card1" shadow="hover">
      <template #header>
        <span>
          <!--          <vab-icon icon="shopping-cart-line" />-->
          今日投注人数
        </span>
      </template>
      <el-row v-for="(val, key , i) in tag" :key="key">
        <el-row style="margin-top: -30px">
          <el-col :span="24">
            <span>
              <h1>{{key}}
                <vue-count-to
                  :decimals="loginCount.decimals"
                  :duration="loginCount.duration"
                  :end-val=val.todayBetsNum
                  :prefix="loginCount.prefix"
                  :separator="loginCount.separator"
                  :start-val="loginCount.startVal"
                  :suffix="loginCount.suffix"
                />
              </h1>
            </span>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            总投注人数
            <vue-count-to
              :decimals="totalBetNums.decimals"
              :duration="totalBetNums.duration"
              :end-val=val.totalBetsNum
              :prefix="totalBetNums.prefix"
              :separator="totalBetNums.separator"
              :start-val="totalBetNums.startVal"
              :suffix="totalBetNums.suffix"
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
        tag:[],
        loginCount: {
          startVal: 0,
          endVal: 0,
          decimals: 0,
          prefix: '',
          suffix: '',
          separator: ',',
          duration: 1000,
        },
        totalBetNums: {
          startVal: 0,
          endVal: 0,
          decimals: 0,
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
        console.log(data)
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
