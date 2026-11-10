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
            <el-table-column prop="title" label="任务名称" />
            <el-table-column prop="username" label="接单用户" />
            <el-table-column prop="money" label="奖励金额" />
            <el-table-column prop="content" label="审核内容" />
            <el-table-column
                  prop="image"
                  label="审核图片"
                  align="center"
                  width="150">
               <template slot-scope="scope">
               <el-popover placement="top-start" trigger="click">
               <!--trigger属性值：hover、click、focus 和 manual-->
               <a :href="scope.row.img"  target="_blank" title="查看最大化图片">
               <img :src="scope.row.img" style="width: 500px;height: 500px">
                </a>
                <img slot="reference" :src="scope.row.img" style="width: 100px;height: 100px; cursor:pointer">
                </el-popover>
               </template>
            </el-table-column>
            <el-table-column prop="state" label="任务状态">
              <template slot-scope="scope">
                <span v-if="scope.row.state ==1 " style="color: #909399">
                  待提交
                </span>
                <span v-else-if="scope.row.state ==2 " style="color: #303133">
                  待审核
                </span>
                <span v-else-if="scope.row.state ==3 " style="color: #5daf34">
                  已完成
                </span>
                <span v-else style="color: red">
                 已拒绝
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="remarks" label="拒绝原因" />
            <el-table-column prop="updatedAt" label="修改时间" />
            <el-table-column label="操作" width="200px">
              <template slot-scope="scope" v-if="scope.row.state ==2">
                <el-button
                  v-permission="'taskUser.acceptTask'"
                  icon="el-icon-edit-outline"
                  type="success"
                  @click="adopt(scope.row)"
                >
                  通过
                </el-button>
                <el-button
                  v-permission="'taskUser.acceptTask'"
                  icon="el-icon-edit-outline"
                  type="danger"
                  @click="refuse(scope.row)"
                >
                  拒绝
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

  </div>
</template>

<script>
  import Pagination from '@/components/Pagination'
  import { DefaultTimeToday, rTime } from '@/utils'
  import { getTaskUserList,acceptTask } from '@/api/task_user'
  import { dictMaps } from '@/api/common'
  import axios from 'axios'
  import BaseForm from '@/components/BaseForm'

  export default {
    name: 'Examination',
    components: { Pagination ,BaseForm},
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
          title:'',
          state:'',
          username:''
        },
        formColumns: {
          username: {
            prop: 'username',
            label: '用户名',
            type: 'text',
          },
          title: {
            prop: 'title',
            label: '任务名称',
            type: 'text',
          },
          state: {
            prop: 'state',
            label: '任务状态',
            type: 'select',
            options: {1:'待提交',2:'待审核',3:'已完成',4:'已拒绝'}
          },
        },
      }
    },
    mounted() {
      this.formData.time = DefaultTimeToday()
      this.fetchAll()
    },
    methods: {
      adopt(row){
        this.$confirm('确认通过吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          acceptTask({ id:row.id,state:3})
            .then((response) => {
              this.loading = false
              this.$message({
                type: 'success',
                message: '操作成功!'
              });
              this.fetchAll()
            })
            .finally(() => {
              this.loading = false
            })
        }).catch(() => {
        });
      },
      refuse(row){
        this.$prompt('请输入原因', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
          }).then(({ value }) => {
            this.loading=true
            acceptTask({ id:row.id,state:4,remarks:value })
              .then((response) => {
                this.loading = false
                this.$message({
                  type: 'success',
                  message: '操作成功!'
                });
                this.fetchAll()
              })
              .finally(() => {
                this.loading = false
              })
          }).catch(() => {
          });
      },
      fetchAll() {
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
          state: 2,
        }
        axios
          .all([
            getTaskUserList(requestData),
          ])
          .then(
            axios.spread((response) => {
              console.log(response)
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
        getTaskUserList(requestData)
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
    },
  }
</script>
