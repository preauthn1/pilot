<template>
  <div class="app-container">
    <el-row>
      <el-col :span="24">
        <el-form ref="formInline" :inline="true" :model="formInline">
          <el-form-item>
            <el-button
              v-permission="'role.create'"
              type="primary"
              icon="el-icon-circle-plus-outline"
              @click="handleShowDialog"
            >
              {{ $t('common.create') }}
            </el-button>
          </el-form-item>
          <el-form-item :label="$t('role.name')" prop="name">
            <el-input
              v-model="formInline.name"
              :placeholder="$t('role.name')"
            />
          </el-form-item>
          <el-form-item :label="$t('common.createTime')" prop="time">
            <el-date-picker
              v-model="formInline.time"
              type="datetimerange"
              range-separator="~"
              :start-placeholder="$t('common.startTime')"
              :end-placeholder="$t('common.endTime')"
              align="right"
            />
          </el-form-item>
          <el-col>
            <el-form-item>
              <el-button type="primary" @click="refreshList">
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
            <el-table-column prop="name" :label="$t('role.name')" />
            <el-table-column
              prop="createdAt"
              :label="$t('common.createdAt')"
              :formatter="rTime"
              sortable
            />
            <el-table-column
              prop="updatedAt"
              :label="$t('common.updatedAt')"
              :formatter="rTime"
              sortable
            />
            <el-table-column :label="$t('common.handle')" width="600px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'role.syncPermissions'"
                  icon="el-icon-setting"
                  type="primary"
                  @click="syncPermissions(scope.row)"
                >
                  {{ $t('role.syncPermissions') }}
                </el-button>
                <el-button
                  v-permission="'role.update'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleShowDialog(scope.row)"
                >
                  {{ $t('common.update') }}
                </el-button>
                <el-popconfirm
                  v-permission="'role.delete'"
                  :title="$t('common.confirmDelete')"
                  :confirm-button-text="$t('common.confirmButtonText')"
                  :cancel-button-text="$t('common.cancelButtonText')"
                  @onConfirm="handleDelete(scope.row.id)"
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
        <el-col :span="24" class="margin-t-10">
          <pagination
            :total="total"
            :page.sync="offset"
            :limit.sync="limit"
            @pagination="getRoles"
          />
        </el-col>
      </el-col>
    </el-row>
    <role-edit ref="dialog" @fetch-data="refreshList" />
    <el-dialog
      :title="syncPermissionsTitle"
      :visible.sync="syncPermissionsVisible"
    >
      <sync-permissions
        :id="syncPermissionsId"
        :id-list="permissionIds"
        :success="success"
      />
    </el-dialog>
  </div>
</template>

<script>
  import { rTime, strToLine } from '@/utils'
  import { roles, role, deleted } from '@/api/role'
  import SyncPermissions from './components/SyncPermissions'
  import RoleEdit from './components/RoleEdit'
  import Pagination from '@/components/Pagination'

  export default {
    name: 'Roles',
    components: { SyncPermissions, Pagination, RoleEdit },
    data() {
      return {
        formInline: {
          name: '',
          time: '',
        },
        total: 0,
        loading: true,
        order: 'descending',
        sort: 'created_at',
        offset: 0,
        limit: 10,
        tableData: [],
        syncPermissionsVisible: false,
        syncPermissionsId: 0,
        syncPermissionsTitle: '',
        permissionIds: '',
      }
    },
    mounted() {
      this.getRoles()
    },
    methods: {
      handleShowDialog(row) {
        this.$refs['dialog'].showDialog(row)
      },
      resetForm(formName) {
        this.$refs[formName].resetFields()
        this.refreshList()
      },
      refreshList(isHomePage = true) {
        // 首页
        if (isHomePage) {
          this.offset = 0
        }
        this.getRoles()
      },
      tableSortChange(column) {
        this.order = column.order ? column.order : 'descending'
        this.sort = strToLine(column.prop)
        this.offset = 0
        this.getRoles()
      },
      getRoles() {
        this.loading = true
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
          name: this.formInline.name,
          guard_name: 'admin',
        }
        if (this.formInline.time !== null && this.formInline.time[0] !== '') {
          requestData['start_at'] = this.formInline.time[0]
        }
        if (this.formInline.time !== null && this.formInline.time[1] !== '') {
          requestData['end_at'] = this.formInline.time[1]
        }
        roles(requestData)
          .then((response) => {
            const { data } = response
            this.loading = false
            this.tableData = data.roles
            this.total = data.total
          })
          .catch((reason) => {
            this.loading = false
            this.tableData = []
            this.total = 0
          })
      },
      rTime(row, column) {
        return rTime(row[column.property])
      },
      handleDelete(id) {
        deleted({
          id: id,
        }).then((response) => {
          this.$message({
            message: response.message,
            type: 'success',
          })
          this.getRoles()
        })
      },
      syncPermissions(row) {
        const { id, name, permissionIds } = row
        this.syncPermissionsId = id
        this.syncPermissionsVisible = true
        this.syncPermissionsTitle = name
        this.permissionIds = permissionIds
      },
      success() {
        this.syncPermissionsId = 0
        this.syncPermissionsVisible = false
        this.getRoles()
      },
    },
  }
</script>

<style scoped></style>
