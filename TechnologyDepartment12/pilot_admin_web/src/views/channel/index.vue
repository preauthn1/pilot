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
          v-permission="'channel.create'"
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
            <el-table-column prop="id" label="渠道ID" />
            <el-table-column prop="name" label="渠道名称" />
            <el-table-column prop="merchantId" label="商户名称">
              <template slot-scope="scope">
                {{ merchantList[scope.row.merchantId] }}
              </template>
            </el-table-column>
            <el-table-column prop="playerPrefix" label="玩家前缀" />
            <el-table-column prop="domain" label="游戏地址" />
            <el-table-column prop="notifyUrl" label="同步余额回调地址" />
            <el-table-column prop="offlineUrl" label="退出游戏通知地址" />
            <el-table-column
              prop="amount"
              label="渠道余额"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="tag" label="游戏标识" />

            <el-table-column label="操作" width="400px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'channel.update'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleShowDialog(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-permission="'channel.delChannel'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleDelete(scope.row)"
                >
                  删除
                </el-button>
                <el-button
                  v-permission="'channel.update'"
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
    <channel-edit
      ref="dialog"
      :merchant-list="merchantList"
      @fetch-data="refreshList"
    />
  </div>
</template>

<script>
  import { getChannelLists, delChannel } from '@/api/channel'
  import ChannelEdit from './components/ChannelEdit'
  import Pagination from '@/components/Pagination'
  import BaseForm from '@/components/BaseForm'
  import axios from 'axios'
  import { dictMaps } from '@/api/common'
  export default {
    name: 'Channel',
    components: { ChannelEdit, Pagination, BaseForm },
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
        },
        formColumns: {
          merchantId: {
            prop: 'merchantId',
            label: '商户',
            type: 'select',
            options: this.merchantList,
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
              dictNames: ['merchantList', 'getChannelList'],
            }),
            getChannelLists(requestData),
          ])
          .then(
            axios.spread((response1, response2) => {
              const { data } = response2
              this.loading = false
              this.tableData = data.list
              this.total = data.total
              this.merchantList = response1.data.merchantList
              this.formColumns.merchantId.options = this.merchantList
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
        getChannelLists(requestData)
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
      handleDelete(row) {
        this.$confirm('确定将用户名为' + row.username + '删除吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            delChannel({ id: row.id }).then((response) => {
              this.$message({
                type: 'success',
                message: response.message,
              })
              this.getList()
            })
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消',
            })
            this.getList()
          })
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
