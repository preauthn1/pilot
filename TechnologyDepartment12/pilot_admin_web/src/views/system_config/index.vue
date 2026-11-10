<template>
  <div class="app-container">
    <el-row>
      <el-col :span="24" style="padding-bottom: 10px">
        <el-button
          v-permission="'systemConfig.create'"
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
            <el-table-column prop="id" label="ID" />
            <el-table-column prop="key" label="键" />
            <el-table-column prop="value" label="值" />
            <el-table-column prop="remark" label="备注" />

            <el-table-column label="操作" width="200px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'systemConfig.update'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleShowDialog(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-permission="'systemConfig.delChannel'"
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
            @pagination="fetchAll"
          />
        </el-col>
      </el-col>
    </el-row>
    <system-config-edit ref="dialog" @fetch-data="refreshList" />
  </div>
</template>

<script>
  import { getSystemConfigList, delSystemConfig } from '@/api/system-config'
  import SystemConfigEdit from './components/SystemConfigEdit'
  import Pagination from '@/components/Pagination'

  export default {
    name: 'SystemConfig',
    components: { SystemConfigEdit, Pagination },
    data() {
      return {
        total: 0,
        loading: true,
        order: 'descending',
        sort: 'created_at',
        offset: 0,
        limit: 10,
        tableData: [],
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
        this.fetchAll()
      },
      fetchAll() {
        this.loading = true
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
        }
        getSystemConfigList(requestData)
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
      handleShowDialog(row) {
        this.$refs['dialog'].showDialog(row)
      },
      handleDelete(row) {
        this.$confirm('确定将配置项' + row.key + '删除吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            delSystemConfig({ id: row.id }).then((response) => {
              this.$message({
                type: 'success',
                message: response.message,
              })
              this.fetchAll()
            })
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消',
            })
            this.fetchAll()
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
