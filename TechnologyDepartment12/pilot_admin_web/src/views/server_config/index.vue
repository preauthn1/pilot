<template>
  <div class="app-container">
    <el-row>
      <el-col :span="24" style="padding-bottom: 10px">
        <base-form
          :form-attr="formAttr"
          :form-data.sync="formData"
          :form-columns="formColumns"
          @handle-submit="refreshList"
          @handle-refresh="refreshList"
        />
        <el-button
          type="primary"
          icon="el-icon-circle-plus-outline"
          @click="handleShowDialog"
        >
          添加
        </el-button>
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
          >
          <!--  <el-table-column prop="id" label="ID" /> -->
            <el-table-column prop="channel" label="渠道">
              <template slot-scope="scope">
                 {{ channelList[scope.row.channel] }}
              </template>
            </el-table-column>
            <el-table-column prop="protocol" label="协议" />
            <el-table-column prop="address" label="协议地址" />
            <el-table-column prop="status" label="服务状态">
              <template slot-scope="scope">
                {{ statusList[scope.row.status] }}
              </template>
            </el-table-column>
            <el-table-column prop="secret" label="密钥" />
            <el-table-column label="操作" width="220px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'admin.update'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleShowDialog(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-permission="'admin.update'"
                  icon="el-icon-circle-plus-outline"
                  type="primary"
                  @click="handleShowCopy(scope.row)"
                >
                一键添加
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
        <el-col :span="24" class="margin-t-10">
          <pagination
            :total="total"
            :page.sync="offset"
            :limit.sync="limit"
            @pagination="getList"
          />
        </el-col>
      </el-col>
    </el-row>
    <server-config-edit
      ref="dialog"
      :status-list="statusList"
      :channel-list="channelList"
      @fetch-data="refreshList"
    />
  </div>
</template>

<script>
  import { getServerConfigList } from '@/api/server_config'
  import ServerConfigEdit from './components/ServerConfigEdit'
  import Pagination from '@/components/Pagination'
  import BaseForm from '@/components/BaseForm'
  import axios from 'axios'
  import { dictMaps } from '@/api/common'

  export default {
    name: 'ServerConfig',
    components: { ServerConfigEdit, Pagination, BaseForm },
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
        statusList: {
          0: '维护',
          1: '开启',
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
          channel: '',
        },
        formColumns: {
          channel: {
            prop: 'channel',
            label: '所属渠道',
            type: 'select',
            options: this.channelList,
          },
        },
      }
    },
    mounted() {
      this.fetchAll()
    },
    methods: {
      handleShowCopy(row){
        this.$refs['dialog'].showDialog(row,true)
      },
      refreshList(isHomePage = true) {
        // 首页
        if (isHomePage) {
          this.offset = 0
        }
        this.getList()
      },
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
              dictNames: ['getChannelList'],
            }),
            getServerConfigList(requestData),
          ])
          .then(
            axios.spread((response1, response2) => {
              console.log( response1.data.getChannelList)
              const { data } = response2
              this.loading = false
              this.tableData = data.list
              this.total = data.total
              this.channelList = response1.data.getChannelList
              this.formColumns.channel.options = this.channelList
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
        getServerConfigList(requestData)
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
      handleShowDialog(row) {
        this.$refs['dialog'].showDialog(row)
      },
      handleEditPwd(row) {
        this.$refs['editPwd'].showDialog(row)
      },
      handleDelete(row) {
        this.$confirm('确定将配置项' + row.id + '删除吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            this.$message({
              type: 'info',
              message: '删除功能暂未开放',
            })
          })
          .catch(() => {})
      },
    },
  }
</script>

<style scoped>
  .el-tags {
    margin-top: 5px;
    margin-left: 5px;
  }

  .see-more-text {
    font-size: 12px;
  }

  .see-more-tag .el-tag {
    margin-top: 5px;
    margin-left: 5px;
  }
</style>
