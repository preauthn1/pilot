<template>
  <div class="app-container">
    <el-row>
      <el-col :span="24" style="padding-bottom: 10px">
        <el-button
          v-permission="'currencySetting.create'"
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
            <el-table-column prop="currency" label="币种" />
            <el-table-column prop="tag" label="符号" />

            <el-table-column label="操作" width="200px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'gameControl.delete'"
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
    <currency-setting-edit ref="dialog" @fetch-data="refreshList" />
  </div>
</template>

<script>
  import { getCurrencyList, deleteCurrency } from '@/api/currency_setting'
  import CurrencySettingEdit from './components/CurrencySettingEdit'
  import Pagination from '@/components/Pagination'
  import { strToLine } from '@/utils'

  export default {
    name: 'CurrencySetting',
    components: { CurrencySettingEdit, Pagination },
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
        getCurrencyList(requestData)
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
      handleDelete(row) {
        deleteCurrency({
          id: row.id,
        }).then((response) => {
          this.$message({
            message: response.message,
            type: 'success',
          })
          this.fetchAll()
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
