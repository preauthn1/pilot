<template>
  <div class="app-container">
    <el-row>
      <el-col :span="24" class="margin-t-10">
        <base-form
          :form-attr="formAttr"
          :form-data.sync="formData"
          :form-columns="formColumns"
          @handle-submit="refreshList"
          @handle-refresh="refreshList"
        />
      </el-col>
      <el-col v-loading="loading" :span="24">
        <el-col :span="24">
          <el-table
            highlight-current-row
            border
            :max-height="tableHeight"
            :data="tableData"
            style="width: 100%"
            :default-sort="{ prop: sort, order: order }"
            @sort-change="tableSortChange"
          >
            <el-table-column prop="id" label="游戏编号" />
            <el-table-column prop="merchantId" label="商户">
              <template slot-scope="scope">
                {{ merchantList[scope.row.merchantId] }}
              </template>
            </el-table-column>
            <el-table-column prop="channelId" label="渠道">
              <template slot-scope="scope">
                {{ channelList[scope.row.channelId] }}
              </template>
            </el-table-column>
            <el-table-column prop="username" label="玩家账号" />
            <el-table-column prop="betTime" label="投注时间" width="160px" />
            <el-table-column prop="finishTime" label="结算时间" width="160px" />
            <el-table-column prop="bureauNumber" label="局号" width="180px" />
            <el-table-column prop="betType" label="投注类型">
              <template slot-scope="scope">
                {{ betTypeList[scope.row.betType] }}
              </template>
            </el-table-column>
            <el-table-column
              prop="bet"
              label="投注金额"
              :formatter="$util.fenToYuan"
            />
            <el-table-column
              prop="settlementMultiple"
              label="玩家结算倍数"
              :formatter="$util.fenToYuan"
            />
            <el-table-column
              prop="payOut"
              label="派彩金额"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="payOut" label="玩家本局盈亏">
              <template slot-scope="scope">
                {{ (scope.row.payOut-scope.row.bet) / 100 }}
              </template>
            </el-table-column>
            <el-table-column
              prop="result"
              label="游戏结果倍数"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="billingType" label="结算类型">
              <template slot-scope="scope">
                {{ billingTypeList[scope.row.billingType] }}
              </template>
            </el-table-column>
            <el-table-column
              prop="tag"
              label="币种"
            />
          </el-table>

        </el-col>
        <el-col :span="24">
          <pagination
            :total="total"
            :page.sync="offset"
            :limit.sync="limit"
            @pagination="getList"
          />
        </el-col>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  import Pagination from '@/components/Pagination'
  import BaseForm from '@/components/BaseForm'
  import { getCoinRecordList } from '@/api/user_betting_history'
  import { rTime } from '@/utils'
  import axios from 'axios'
  import { dictMaps } from '@/api/common'
  import { DefaultTimeToday } from '@/utils'
  import { getCurrencyList } from '@/api/currency_setting'
  export default {
    name: 'GameSettlementRecord',
    components: { Pagination, BaseForm },
    data() {
      return {
        total: 0,
        loading: true,
        order: 'descending',
        sort: 'finish_time',
        offset: 0,
        limit: 10,
        tableData: [],
        tableHeight: 550,
        merchantList: {},
        channelList: {},
        betTypeList: { 0: '玩家手动', 1: '玩家自动' },
        billingTypeList: {
          0: '系统自动',
          1: '系统手动',
        },
        formAttr: {
          title: 'search',
          isInline: true,
          submitButtonText: this.$t('common.search'),
          showReset: true,
          showCancel: false,
          labelWidth: '',
        },
        formData: {
          id: '',
          merchantId: '',
          channelId: '',
          username: '',
          bureauNumber: '',
          time: '',
          tag:''
        },
        currencyList:{},
        formColumns: {
          id: {
            prop: 'id',
            label: '游戏编号',
            type: 'text',
          },
          merchantId: {
            prop: 'merchantId',
            label: '商户',
            type: 'select',
            options: this.merchantList,
          },
          channelId: {
            prop: 'channelId',
            label: '渠道',
            type: 'select',
            options: this.channelList,
          },
          username: {
            prop: 'username',
            label: '玩家账号',
            type: 'text',
          },
          bureauNumber: {
            prop: 'bureauNumber',
            label: '局号',
            type: 'text',
          },
          time: {
            prop: 'time',
            label: '日期',
            type: 'datePicker',
          },
          tag:{
            prop: 'tag',
            label: '币种',
            type: 'select',
            options: this.currencyList,
          },
        },
      }
    },
    mounted() {
      this.formData.time = DefaultTimeToday()
      this.fetchAll()
      this.$nextTick(() => {
        this.calcTableHeight()
      })
      window.addEventListener('resize', this.calcTableHeight)
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.calcTableHeight)
    },
    methods: {
      calcTableHeight() {
        this.$nextTick(() => {
          const el = this.$el
          if (!el) return
          const top = el.getBoundingClientRect().top
          // 扣除搜索栏 + 分页 + 内边距的大致高度
          const overhead = 150
          this.tableHeight = window.innerHeight - top - overhead
        })
      },
      fetchAll() {
        this.loading = true
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
          ...this.formData,
        }
        if (
          this.formData.time !== null &&
          rTime(this.formData.time[0]) !== ''
        ) {
          requestData['start_at'] = rTime(this.formData.time[0])
        }
        if (
          this.formData.time !== null &&
          rTime(this.formData.time[1]) !== ''
        ) {
          requestData['end_at'] = rTime(this.formData.time[1])
        }
        axios
          .all([
            dictMaps({
              dictNames: ['merchantList', 'getChannelList','currencyList'],
            }),
            getCoinRecordList(requestData),
          ])
          .then(
            axios.spread((response1, response2) => {
              const { data } = response2
              this.loading = false
              this.tableData = data.list
              this.total = data.total
              this.merchantList = response1.data.merchantList
              this.formColumns.merchantId.options = this.merchantList
              this.channelList = response1.data.getChannelList
              this.formColumns.channelId.options = this.channelList
              this.currencyList = response1.data.currencyList
              this.formColumns.tag.options = this.currencyList
              this.$nextTick(() => {
                this.calcTableHeight()
              })
            })
          )
          .catch(() => {
            this.loading = false
            this.tableData = []
            this.total = 0
          })
      },
      getList() {
        this.loading = true
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
          ...this.formData,
        }
        if(requestData.tag){
            requestData.tag = this.currencyList[requestData.tag];
        }
        if (
          this.formData.time !== null &&
          rTime(this.formData.time[0]) !== ''
        ) {
          requestData['start_at'] = rTime(this.formData.time[0])
        }
        if (
          this.formData.time !== null &&
          rTime(this.formData.time[1]) !== ''
        ) {
          requestData['end_at'] = rTime(this.formData.time[1])
        }
        getCoinRecordList(requestData)
          .then((response) => {
            const { data } = response
            this.loading = false
            this.tableData = data.list
            this.total = data.total
          })
          .catch((reason) => {
            this.loading = false
            this.tableData = []
            this.total = 0
          })
      },
      tableSortChange(column) {
        this.order = column.order ? column.order : 'descending'
        this.sort = column.prop
        this.refreshList()
      },
      refreshList(isHomePage = true) {
        // 首页
        if (isHomePage) {
          this.offset = 0
        }
        this.getList()
      },
      handleShowDialog(row) {
        this.$refs['dialog'].showDialog(row)
      },
    },
  }
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
}
.app-container > .el-row {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.app-container > .el-row > .el-col:last-child {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.app-container > .el-row > .el-col:last-child > .el-col:first-child {
  flex: 1;
  min-height: 0;
}
</style>
