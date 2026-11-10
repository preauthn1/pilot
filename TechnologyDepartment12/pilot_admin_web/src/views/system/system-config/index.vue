<template>
  <div class="app-container">
    <el-row>
      <el-col :span="24">
        <el-form ref="formInline" :inline="true" :model="formInline">
          <el-form-item>
            <el-button
              v-permission="'systemConfig.create'"
              type="primary"
              icon="el-icon-circle-plus-outline"
              @click="handleEdit"
            >
              {{ $t('common.create') }}
            </el-button>
          </el-form-item>
          <el-form-item :label="$t('systemConfig.key')" prop="key">
            <el-input
              v-model="formInline.key"
              :placeholder="$t('systemConfig.key')"
            />
          </el-form-item>
          <el-col>
            <el-form-item>
              <el-button type="primary" @click="onSubmit">
                {{ $t('common.search') }}
              </el-button>
              <el-button @click="resetForm('formInline')">
                {{ $t('common.reset') }}
              </el-button>
            </el-form-item>
          </el-col>
        </el-form>
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
            <el-table-column prop="id" :label="$t('systemConfig.id')" />
            <el-table-column prop="key" :label="$t('systemConfig.key')" />
            <el-table-column prop="value" :label="$t('systemConfig.value')" />
            <el-table-column prop="remark" :label="$t('systemConfig.remark')" />
            <el-table-column :label="$t('common.handle')" width="240px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'systemConfig.update'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleEdit(scope.row)"
                >
                  {{ $t('common.update') }}
                </el-button>
                <el-popconfirm
                  v-permission="'systemConfig.delete'"
                  :title="$t('common.confirmDelete')"
                  :confirm-button-text="$t('common.confirmButtonText')"
                  :cancel-button-text="$t('common.cancelButtonText')"
                  @confirm="handleDelete(scope.row.id)"
                >
                  <el-button
                    slot="reference"
                    icon="el-icon-delete"
                    type="danger"
                  >
                    {{ $t('common.delete') }}
                  </el-button>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
        <el-col :span="24">
          <pagination
            :total="total"
            :page.sync="offset"
            :limit.sync="limit"
            @pagination="fetchData"
          />
        </el-col>
      </el-col>
    </el-row>
    <edit ref="edit" @fetch-data="fetchData" />
  </div>
</template>

<script>
  import Pagination from '@/components/Pagination'
  import {
    systemConfigs,
    systemConfigDelete,
  } from '@/api/system-config/system-config'
  import { strToLine } from '@/utils'
  import Edit from './components/SystemConfigEdit'
  export default {
    name: 'SystemConfig',
    components: { Pagination, Edit },
    data() {
      return {
        formInline: {
          key: '',
        },
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
      this.fetchData()
    },
    methods: {
      handleEdit(row) {
        if (row) {
          this.$refs['edit'].showEdit(row)
        } else {
          this.$refs['edit'].showEdit()
        }
      },
      onSubmit() {
        this.offset = 0
        this.fetchData()
      },
      resetForm(formName) {
        this.$refs[formName].resetFields()
        this.offset = 0
        this.fetchData()
      },
      fetchData() {
        this.loading = true
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
          key: this.formInline.key,
        }
        systemConfigs(requestData)
          .then((response) => {
            const { data } = response
            this.loading = false
            this.tableData = data.systemConfigs
            this.total = data.total
          })
          .catch((reason) => {
            this.loading = false
            this.tableData = []
            this.total = 0
          })
      },
      ableSortChange(column) {
        this.order = column.order ? column.order : 'descending'
        this.sort = strToLine(column.prop)
        this.offset = 0
        this.fetchData()
      },
      tableSortChange(column) {
        this.order = column.order ? column.order : 'descending'
        this.sort = strToLine(column.prop)
        this.offset = 0
        this.fetchData()
      },
      handleDelete(id) {
        systemConfigDelete({
          id: id,
        }).then((response) => {
          this.$message({
            message: response.message,
            type: 'success',
          })
          this.fetchData()
        })
      },
    },
  }
</script>

<style scoped></style>
