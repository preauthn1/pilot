<template>
  <div class="app-container">
    <df-button :data="[totalWinOrLoss / 100]" type="danger">总盈亏</df-button>
    <df-button :data="[totalBets / 100]" type="danger">总投注</df-button>
    <df-button :data="[totalPayOut / 100]" type="danger">总派彩</df-button>
    <df-button :data="[totalPlayerWinOrLoss / 100]" type="danger">
      玩家总输赢
    </df-button>
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
            <el-table-column prop="createdAt" label="日期" :formatter="rTime" />
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
            <el-table-column prop="betsNumber" label="投注玩家数量" />
            <el-table-column
              prop="bets"
              label="投注金额"
              :formatter="$util.fenToYuan"
            />
            <el-table-column
              prop="payout"
              label="派彩"
              :formatter="$util.fenToYuan"
            />
            <el-table-column
              prop="playerWl"
              label="玩家输赢"
              :formatter="$util.fenToYuan"
            />
            <el-table-column
              prop="platformWl"
              label="平台输赢"
              :formatter="$util.fenToYuan"
            />
            <el-table-column
              prop="tag"
              label="币种"
            />
            <!--            <el-table-column-->
            <!--              prop="createdAt"-->
            <!--              label="创建时间"-->
            <!--              :formatter="rTime"-->
            <!--            />-->
            <!--            <el-table-column-->
            <!--              prop="updatedAt"-->
            <!--              label="更新时间"-->
            <!--              :formatter="rTime"-->
            <!--            />-->
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
  import { getChannelReportList } from '@/api/merchant_statement/channelSummary'
  import { rTime, strToLine } from '@/utils'
  import axios from 'axios'
  import { dictMaps } from '@/api/common'
  export default {
    name: 'ChannelSummary',
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
        merchantList: {},
        channelList: {},
        totalWinOrLoss: 0,
        totalBets: 0,
        totalPayOut: 0,
        totalPlayerWinOrLoss: 0,
        formAttr: {
          title: 'search',
          isInline: true,
          submitButtonText: this.$t('common.search'),
          showReset: true,
          showCancel: false,
          labelWidth: '',
        },
        formData: {
          merchantId: '',
          channelId: '',
          time: '',
          tag:''
        },
        currencyList:{},
        formColumns: {
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
        }
        axios
          .all([
            dictMaps({
              dictNames: ['merchantList', 'getChannelList','currencyList'],
            }),
            getChannelReportList(requestData),
          ])
          .then(
            axios.spread((response1, response2) => {
              const { data } = response2
              this.loading = false
              this.tableData = data.list
              this.total = data.total
              this.totalWinOrLoss = data.totalWinOrLoss
              this.totalBets = data.totalBets
              this.totalPayOut = data.totalPayOut
              this.totalPlayerWinOrLoss = data.totalPlayerWinOrLoss
              this.merchantList = response1.data.merchantList
              this.formColumns.merchantId.options = this.merchantList
              this.channelList = response1.data.getChannelList
              this.formColumns.channelId.options = this.channelList
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
        getChannelReportList(requestData)
          .then((response) => {
            const { data } = response
            this.loading = false
            this.tableData = data.list
            this.total = data.total
            this.totalWinOrLoss = data.totalWinOrLoss
            this.totalBets = data.totalBets
            this.totalPayOut = data.totalPayOut
            this.totalPlayerWinOrLoss = data.totalPlayerWinOrLoss
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
      rTime(row, column) {
        return rTime(row[column.property])
      },
    },
  }
</script>
