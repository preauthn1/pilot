<template>
  <div class="app-container">
    <el-row>
      <el-col :span="24" style="padding-bottom: 10px">
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
            <el-table-column
              prop="profitLoss"
              label="平台盈亏"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="multiplier" label="倍数公式乘数" />

            <el-table-column label="操作" width="200px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'admin.update'"
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
    <pool-edit ref="dialog" @fetch-data="refreshList" />
  </div>
</template>

<script>
  import { getPoolList } from '@/api/pool_settings'
  import PoolEdit from './components/PoolEdit'
  import Pagination from '@/components/Pagination'
  import { strToLine } from '@/utils'

  export default {
    name: 'PoolSettings',
    components: { PoolEdit, Pagination },
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
        getPoolList(requestData)
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
