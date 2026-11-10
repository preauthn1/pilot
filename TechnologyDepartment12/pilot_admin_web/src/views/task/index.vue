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
          <template #button>
            <el-button
              v-permission="'task.create'"
              type="primary"
              icon="el-icon-circle-plus-outline"
              @click="handleShowDialog"
            >
              {{ $t('common.create') }}
            </el-button>
          </template>
        </base-form>
      </el-col>
      <el-col v-loading="loading" :span="24" >
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
            <el-table-column prop="title" label="任务名称" />
            <el-table-column prop="channel" label="渠道" >
            <template slot-scope="scope">
                {{ channelList[scope.row.channel] }}
              </template>
            </el-table-column>
            <el-table-column prop="system" label="系统配置" >
              <template slot-scope="scope">
                {{ systemList[scope.row.system] }}
              </template>
            </el-table-column>
            <el-table-column prop="state" label="状态" >
              <template slot-scope="scope">
                <span v-if="scope.row.state==1" style="color:forestgreen;">开启</span>
                <span v-else style="color: red;">停用</span>
              </template>
            </el-table-column>
            <el-table-column prop="money" label="奖励金额" />
            <el-table-column prop="num" label="剩余数量" />
            <el-table-column label="操作" width="200px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'task.create'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleShowDialog(scope.row)"
                >
                  编辑
                </el-button>
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
    <task-edit ref="dialog" :systemList="systemList" :channel-list="channelList" @fetch-data="refreshList" />
  </div>
</template>

<script>
  import Pagination from '@/components/Pagination'
  import BaseForm from '@/components/BaseForm'
  import { DefaultTimeToday, rTime } from '@/utils'
  import { getTaskList } from '@/api/task'
  import TaskEdit from './components/TaskEdit'
  import { dictMaps } from '@/api/common'
  import axios from 'axios'
  export default {
    name: 'Task',
    components: {TaskEdit, Pagination, BaseForm },
    data() {
      return {
        total: 0,
        loading: true,
        order: 'descending',
        sort: 'created_at',
        offset: 0,
        limit: 10,
        tableData: [],
        channelList:{},
        systemList:{},
        formAttr: {
          title: 'search',
          isInline: true,
          submitButtonText: this.$t('common.search'),
          showReset: true,
          showCancel: false,
          labelWidth: '',
        },
        formData: {
          title:'',
        },
        formColumns: {
          title: {
            prop: 'title',
            label: '标题',
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
            dictMaps({
              dictNames: ['getChannelList','getSystem'],
            }),
            getTaskList(requestData),
          ])
          .then(
            axios.spread((response1,response) => {
              console.log(response1)
                const { data } = response
                this.loading = false
                this.tableData = data.list
                this.total = data.total
                this.channelList = response1.data.getChannelList
                this.systemList = response1.data.getSystem
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
        getTaskList(requestData)
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
