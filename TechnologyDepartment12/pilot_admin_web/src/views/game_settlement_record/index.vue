<template>
  <div class="app-container">
    <df-button :data="[totalWinOrLoss / 100]" type="danger">
      平台总盈亏
    </df-button>
    <df-button :data="[totalBets / 100]" type="danger">玩家总投注</df-button>
    <df-button :data="[totalExpenses / 100]" type="danger">总支出</df-button>
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
            max-height="550"
            :data="tableData"
            style="width: 100%"
            :default-sort="{ prop: sort, order: order }"
            @sort-change="tableSortChange"
          >
            <el-table-column prop="createdAt" label="日期" />
            <el-table-column prop="roundId" label="局号" />
            <el-table-column
              prop="result"
              label="游戏结算倍数"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="betsNumber" label="玩家投注人数" />
            <el-table-column
              prop="betsAmount"
              label="玩家投注金额"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="winners" label="赢钱人数" />
            <el-table-column
              prop="winOrLoss"
              label="平台输赢"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="billingType" label="游戏结算类型">
              <template slot-scope="scope">
                {{ billingTypeList[scope.row.billingType] }}
              </template>
            </el-table-column>
            <el-table-column
              prop="tag"
              label="币种"
            />
            <el-table-column prop="operator" label="操作者">
              <template slot-scope="scope">
                {{ adminList[scope.row.operator] }}
              </template>
            </el-table-column>
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
  import { getGameRecordList } from '@/api/game_settlement_record'
  import { DefaultTimeToday, rTime } from '@/utils'
  import axios from 'axios'
  import { dictMaps } from '@/api/common'
  import { getUserList } from '@/api/user'
  export default {
    name: 'GameSettlementRecord',
    components: { Pagination, BaseForm },
    data() {
      return {
        total: 0,
        loading: true,
        order: 'descending',
        sort: 'created_at',
        offset: 0,
        limit: 10,
        tableData: [],
        billingTypeList: {},
        totalWinOrLoss: 0,
        totalBets: 0,
        totalExpenses: 0,
        adminList: {},
        formAttr: {
          title: 'search',
          isInline: true,
          submitButtonText: this.$t('common.search'),
          showReset: true,
          showCancel: false,
          labelWidth: '',
        },
        formData: {
          billingType: '',
          roundId: '',
          time: '',
          tag:''
        },
        currencyList:{},
        formColumns: {
          billingType: {
            prop: 'billingType',
            label: '游戏结算类型',
            type: 'select',
            options: this.billingTypeList,
          },
          roundId: {
            prop: 'roundId',
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
    },
    methods: {
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
              dictNames: ['adminInfo','currencyList'],
            }),
            getGameRecordList(requestData),
          ])
          .then(
            axios.spread((response1, response2) => {
              const { data } = response2
              this.loading = false
              this.tableData = data.list
              this.total = data.total
              this.totalWinOrLoss = data.totalWinOrLoss
              this.totalBets = data.totalBets
              this.totalExpenses = data.totalExpenses
              this.billingTypeList = { 0: '系统自动', 1: '系统手动' }
              this.formColumns.billingType.options = this.billingTypeList
              this.adminList = response1.data.adminInfo
              this.currencyList = response1.data.currencyList
              this.formColumns.tag.options = this.currencyList
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
        getGameRecordList(requestData)
          .then((response) => {
            const { data } = response
            this.loading = false
            this.tableData = data.list
            this.total = data.total
            this.totalWinOrLoss = data.totalWinOrLoss
            this.totalBets = data.totalBets
            this.totalExpenses = data.totalExpenses
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
