<template>
  <div class="index-container">
    <el-row :gutter="20">
      <el-col :lg="5" :md="12" :sm="24" :xl="5" :xs="24">
        <Recharge ref="Recharge" />
      </el-col>
      <el-col :lg="5" :md="12" :sm="24" :xl="5" :xs="24">
        <Prize ref="Prize" />
      </el-col>
      <el-col :lg="5" :md="12" :sm="24" :xl="5" :xs="24">
        <WinLost ref="WinLost" />
      </el-col>
      <el-col :lg="5" :md="12" :sm="24" :xl="5" :xs="24">
        <betNums ref="betNumsData" />
      </el-col>
    </el-row>
  </div>
</template>

<script>
  import { getHomeList } from '@/api/home'
  import Recharge from './components/Recharge'
  import Prize from './components/Prize'
  import WinLost from './components/WinLost'
  import betNums from './components/betNums'
  export default {
    name: 'Home',
    components: {
      WinLost,
      Recharge,
      Prize,
      betNums,
    },
    data() {
      return {
        rechargeData: {},
        prizeData: {},
        winLostData: {},
        betNumsData: {},
      }
    },
    created() {
      this.fetchAll()
    },
    methods: {
      initShow() {
        this.$refs['Recharge'].showRecharge(this.rechargeData)
        this.$refs['Prize'].showPrize(this.prizeData)
        this.$refs['WinLost'].showWinLost(this.winLostData)
        this.$refs['betNumsData'].showWinLost(this.betNumsData)
      },
      fetchAll() {
        this.loading = true
        getHomeList()
          .then((response) => {
            const { data } = response
            this.loading = false
            this.rechargeData = response.data.recharge
            this.prizeData = response.data.prize
            this.winLostData = response.data.winLost
            this.betNumsData = response.data.BetsNums
            this.initShow()
          })
          .catch((reason) => {
            this.loading = false
            this.tableData = []
            this.total = 0
          })
      },
    },
  }
</script>
<style lang="scss" scoped></style>
