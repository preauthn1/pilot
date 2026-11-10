<template>
  <div class="home">
    <el-card class="recharge-card1" shadow="hover">
      <template #header>
        <span>
          <!--          <vab-icon icon="exchange-line" />-->
          今日派奖
        </span>
      </template>
      <el-row v-for="(val, key , i) in tag" :key="key">
        <el-row style="margin-top: -30px">
          <el-col :span="24">
            <span>
              <h1>
                {{key}}
                <vue-count-to
                  :decimals="currentExchange.decimals"
                  :duration="currentExchange.duration"
                  :end-val=(val.todayPayOut/100)
                  :prefix="currentExchange.prefix"
                  :separator="currentExchange.separator"
                  :start-val="currentExchange.startVal"
                  :suffix="currentExchange.suffix"
                />
              </h1>
            </span>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="14">
            总派奖
            <vue-count-to
              :decimals="totalExchange.decimals"
              :duration="totalExchange.duration"
              :end-val=(val.totalPayOut/100)
              :prefix="totalExchange.prefix"
              :separator="totalExchange.separator"
              :start-val="totalExchange.startVal"
              :suffix="totalExchange.suffix"
            />
          </el-col>
        </el-row>
      </el-row>
     <!-- <el-row style="margin-top: -30px">
        <el-col :span="24">
          <span>
            <h1>
              U-
              <vue-count-to
                :decimals="currentExchange.decimals"
                :duration="currentExchange.duration"
                :end-val="currentExchange.endVal1"
                :prefix="currentExchange.prefix"
                :separator="currentExchange.separator"
                :start-val="currentExchange.startVal"
                :suffix="currentExchange.suffix"
              />
            </h1>
          </span>
        </el-col>
      </el-row> -->
     <!-- <el-row>
        <el-col :span="12">
          总派奖
          <vue-count-to
            :decimals="totalExchange.decimals"
            :duration="totalExchange.duration"
            :end-val="totalExchange.endVal1"
            :prefix="totalExchange.prefix"
            :separator="totalExchange.separator"
            :start-val="totalExchange.startVal"
            :suffix="totalExchange.suffix"
          />
        </el-col>
      </el-row> -->
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
        currentExchange: {
          startVal: 0,
          endVal: 0,
          endVal1: 0,
          decimals: 2,
          prefix: '',
          suffix: '',
          separator: ',',
          duration: 1000,
        },
        totalExchange: {
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
        cny: 0,
        monthCny: 0,
        edition: false,
      }
    },
    methods: {
      showPrize(data) {
        this.tag = data
      },
    },
  }
</script>
<style lang="scss" scoped>
  //.recharge {
  //  &-card1 {
  //    height: 174px;
  //    background: linear-gradient(to right, #60b2fb, #6485f6);
  //
  //    //&-content {
  //    //  text-align: center;
  //    //}
  //
  //    ::v-deep {
  //      .el-card {
  //        &__header,
  //        &__body {
  //          color: $base-color-white !important;
  //        }
  //      }
  //    }
  //  }
  //
  //  margin-bottom: $base-margin;
  //}
</style>
