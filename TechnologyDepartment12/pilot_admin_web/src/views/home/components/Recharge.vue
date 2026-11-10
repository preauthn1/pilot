<template>
  <div class="home">
    <el-card class="recharge-card1" shadow="hover">
      <template #header>
        <span>今日投注</span>
      </template>
      <el-row v-for="(val, key , i) in tag" :key="key">
        <el-row style="margin-top: -30px">
          <el-col :span="24">
            <span>
              <h1>
                {{key}}
                <vue-count-to
                  :decimals="currentRecharge.decimals"
                  :duration="currentRecharge.duration"
                  :end-val=(val.todayBets/100)
                  :prefix="currentRecharge.prefix"
                  :separator="currentRecharge.separator"
                  :start-val="currentRecharge.startVal"
                  :suffix="currentRecharge.suffix"
                />
              </h1>
            </span>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="14">
            总投注
            <vue-count-to
              :decimals="totalRecharge.decimals"
              :duration="totalRecharge.duration"
              :end-val=(val.totalBets/100)
              :prefix="totalRecharge.prefix"
              :separator="totalRecharge.separator"
              :start-val="totalRecharge.startVal"
              :suffix="totalRecharge.suffix"
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
        currentRecharge: {
          startVal: 0,
          endVal: 0,
          decimals: 2,
          prefix: '',
          suffix: '',
          separator: ',',
          duration: 1000,
        },
        totalRecharge: {
          startVal: 0,
          endVal: 0,
          decimals: 2,
          prefix: '',
          suffix: '',
          separator: ',',
          duration: 1000,
        },
        weekRatio: 0,
        dayRatio: 0,
        payRate: 0,
        cny: 0,
        monthCny: 0,
        edition: false,
      }
    },
    methods: {
      showRecharge(data) {
        this.tag = data
      },
    },
  }
</script>
<style lang="scss" scoped></style>
