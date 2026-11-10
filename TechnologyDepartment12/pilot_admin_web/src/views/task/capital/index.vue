<template>
  <div class="app-container">
    <el-row>
      <el-col :span="24">
        <base-form
          :form-attr="formAttr"
          :form-data.sync="formData"
          :form-columns="formColumns"
          @handle-submit="refreshList"
          @handle-refresh="refreshList"
        >
        </base-form>
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
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="refId" label="结算编号" />
          <el-table-column prop="money" label="奖励金额" />
          <el-table-column prop="beforeCoin" label="通过前余额" />
          <el-table-column prop="afterCoin" label="通过后余额" />
          <el-table-column prop="tag" label="币种" />
          <el-table-column prop="createdAt" label="创建时间" />
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
  import { DefaultTimeToday, rTime } from '@/utils'
  import { getTaskCapitalList } from '@/api/task_capital'
  import { dictMaps } from '@/api/common'
  import axios from 'axios'
  export default {
    name: 'TaskCapital',
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
        formAttr: {
          title: 'search',
          isInline: true,
          submitButtonText: this.$t('common.search'),
          showReset: true,
          showCancel: false,
          labelWidth: '',
        },
        formData: {
          username:'',
          refId:'',
        },
        formColumns: {
          username: {
            prop: 'username',
            label: '用户名',
            type: 'text',
          },
          refId: {
            prop: 'refId',
            label: '结算编号',
            type: 'text',
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
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
        }
        axios
          .all([
            getTaskCapitalList(requestData),
          ])
          .then(
            axios.spread((response) => {
                const { data } = response
                this.loading = false
                this.tableData = data.list
                this.total = data.total
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
        getTaskCapitalList(requestData)
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
      }
    },
  }
</script>
