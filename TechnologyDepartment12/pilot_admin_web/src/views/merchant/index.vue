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
          v-permission="'merchant.create'"
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
            <el-table-column prop="id" label="商户ID" />
            <el-table-column prop="username" label="商户名称" />
            <el-table-column prop="secret" label="密钥" />

            <el-table-column label="操作" width="400px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'merchant.update'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleShowDialog(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-permission="'merchant.editPwd'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleEditPwd(scope.row)"
                >
                  修改密码
                </el-button>
                <el-button
                  v-permission="'merchant.delMerchant'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleDelete(scope.row)"
                >
                  删除
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
    <merchant-edit ref="dialog" @fetch-data="refreshList" />
    <pwd-edit ref="editPwd" @fetch-data="refreshList" />
  </div>
</template>

<script>
  import { getMerchantList, delMerchant } from '@/api/merchant'
  import MerchantEdit from './components/MerchantEdit'
  import PwdEdit from './components/PwdEdit'
  import Pagination from '@/components/Pagination'
  import BaseForm from '@/components/BaseForm'
  import { rTime, strToLine } from '@/utils'
  import { outGame } from '@/api/user'

  export default {
    name: 'Merchant',
    components: { MerchantEdit, Pagination, BaseForm, PwdEdit },
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
          username: '',
        },
        formColumns: {
          username: {
            prop: 'username',
            label: '商户名称',
            type: 'text',
          },
        },
      }
    },
    mounted() {
      this.fetchAll()
    },
    methods: {
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
        getMerchantList(requestData)
          .then((response) => {
            const { data } = response
            this.loading = false
            this.tableData = data.list
            this.total = data.total
          })
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
        getMerchantList(requestData)
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
        this.$confirm('确定将用户名为' + row.username + '删除吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            delMerchant({ id: row.id }).then((response) => {
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
