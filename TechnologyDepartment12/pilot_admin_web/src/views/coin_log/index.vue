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
            max-height="550"
            :data="tableData"
            style="width: 100%"
            :default-sort="{ prop: sort, order: order }"
            @sort-change="tableSortChange"
          >
            <el-table-column prop="orderId" label="订单号" />
            <el-table-column prop="channelOrderId" label="渠道订单号" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column
              prop="coin"
              label="金额"
              :formatter="$util.fenToYuan"
            />
            <el-table-column
              prop="currency"
              label="币种"
            />
            <el-table-column prop="channelId" label="渠道">
              <template slot-scope="scope">
                {{ channelList[scope.row.channelId] }}
              </template>
            </el-table-column>
            <el-table-column prop="type" label="转账类型">
              <template slot-scope="scope">
                {{ typeList[scope.row.type] }}
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="记录时间" />
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
  import { getCoinLogList } from '@/api/coin_log'
  import { DefaultTimeToday, rTime } from '@/utils'
  import axios from 'axios'
  import { dictMaps } from '@/api/common'
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
        channelList: {},
        typeList: { 1: '转入', 2: '转出' },
        formAttr: {
          title: 'search',
          isInline: true,
          submitButtonText: this.$t('common.search'),
          showReset: true,
          showCancel: false,
          labelWidth: '',
        },
        formData: {
          type: '',
          username: '',
          time: '',
          tag:'',
        },
        currencyList:{},
        formColumns: {
          type: {
            prop: 'type',
            label: '操作类型',
            type: 'select',
            options: this.typeList,
          },
          username: {
            prop: 'username',
            label: '玩家账号',
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
          }
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
              dictNames: ['getChannelList','currencyList'],
            }),
            getCoinLogList(requestData),
          ])
          .then(
            axios.spread((response1, response2) => {
              const { data } = response2
              this.loading = false
              this.tableData = data.list
              this.total = data.total
              this.channelList = response1.data.getChannelList
              // this.formColumns.channelId.options = this.channelList
              this.formColumns.type.options = this.typeList
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
        getCoinLogList(requestData)
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
