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
              v-permission="'admin.create'"
              type="primary"
              icon="el-icon-circle-plus-outline"
              @click="handleShowDialog"
            >
              {{ $t('common.create') }}
            </el-button>
          </template>
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
            <el-table-column prop="id" :label="$t('admin.id')" />
            <el-table-column prop="name" :label="$t('admin.name')" />
            <el-table-column prop="adminType" label="管理员类型">
              <template slot-scope="scope">
                {{ adminTypeList[scope.row.adminType] }}
              </template>
            </el-table-column>
            <el-table-column prop="merchantId" label="所属商户">
              <template slot-scope="scope">
                <span v-for="cell,idx in scope.row.merchantId" style="margin-right: 5px;">{{ merchantList[cell] }}{{ idx<(scope.row.merchantId.length-1)?',':'' }}</span>

              </template>
            </el-table-column>
            <el-table-column prop="channelId" label="所属渠道">
              <template slot-scope="scope">
                {{ channelList[scope.row.channelId] }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('admin.roles')">
              <template slot-scope="scope">
                {{ roleList[scope.row.roleId] }}
              </template>
            </el-table-column>
            <el-table-column prop="status" :label="$t('admin.status')">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.status === 1" type="success">
                  {{ $t('admin.status1Text') }}
                </el-tag>
                <el-tag v-else type="danger">
                  {{ $t('admin.status0Text') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.handle')" width="700px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'admin.update'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleShowDialog(scope.row)"
                >
                  {{ $t('common.update') }}
                </el-button>
                <el-button
                  v-permission="'admin.reset'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="resetGooGleQrCode(scope.row)"
                >
                  {{ $t('admin.resetGoogleCode') }}
                </el-button>
                <el-button
                  v-permission="'admin.reset'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="showGooGleQrCode(scope.row)"
                >
                  {{ $t('admin.googleCode') }}
                </el-button>
                <el-popconfirm
                  v-permission="'admin.delete'"
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
        <el-col :span="24" class="margin-t-10">
          <pagination
            :total="total"
            :page.sync="offset"
            :limit.sync="limit"
            @pagination="getAdmins"
          />
        </el-col>
      </el-col>
    </el-row>
    <admin-edit
      ref="dialog"
      :role-list="roleList"
      :merchant-list="merchantList"
      :channel-list="channelList"
      :admin-type-list="adminTypeList"
      @fetch-data="refreshList"
    />
  </div>
</template>

<script>
  import { rTime, strToLine } from '@/utils'
  import { admins, deleted, reset } from '@/api/admin'
  import axios from 'axios'
  import { dictMaps } from '@/api/common'
  import BaseForm from '@/components/BaseForm'
  import AdminEdit from './components/AdminEdit'
  import Pagination from '@/components/Pagination'

  export default {
    name: 'Admin',
    components: { BaseForm, AdminEdit, Pagination },
    data() {
      return {
        adminTypeList: {
          0: '内部管理员',
          1: '商户管理员',
          //2: '渠道管理员',
        },
        merchantList: {},
        channelList: {},
        formAttr: {
          title: 'search',
          isInline: true,
          submitButtonText: this.$t('common.search'),
          showReset: true,
          showCancel: false,
          labelWidth: '',
        },
        formData: {
          name: '',
          merchantId: '',
          channelId: '',
          roleId: '',
          time: '',
        },
        formColumns: {
          name: {
            prop: 'name',
            label: this.$t('admin.name'),
            type: 'text',
          },
          merchantId: {
            prop: 'merchantId',
            label: '所属商户',
            type: 'select',
            options: this.merchantList,
          },
          channelId: {
            prop: 'channelId',
            label: '所属渠道',
            type: 'select',
            options: this.channelList,
          },
          roleId: {
            prop: 'roleId',
            label: this.$t('admin.roles'),
            type: 'select',
            options: this.roleList,
          },
          time: {
            prop: 'time',
            label: this.$t('common.operateTime'),
            type: 'dateTimePicker',
          },
        },
        total: 0,
        loading: true,
        order: 'descending',
        sort: 'created_at',
        offset: 0,
        limit: 10,
        tableData: [],
        roleList: {},
        isPackageList: {
          0: '否',
          1: '是',
        },
      }
    },
    mounted() {
      this.fetchAll()
    },
    methods: {
      showGooGleQrCode(row) {
        // 显示二维码
        if (!row.googleEncrypt) {
          return this.$message('该账号未生成谷歌验证码')
        }
        const urlencoded = encodeURI(
          'otpauth://totp/' + row.name + '?secret=' + row.googleEncrypt
        )
        const qrcodeurl =
          'https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=' +
          urlencoded
        this.$alert(
          '<div><span>用户名：' +
            row.name +
            '</span><br><img alt="加载中..." src="' +
            qrcodeurl +
            '"/><br><span>秘钥：' +
            row.googleEncrypt +
            '</span></div>',
          '谷歌验证码',
          {
            dangerouslyUseHTMLString: true,
            center: true,
          }
        )
      },
      resetGooGleQrCode(row) {
        this.$confirm(
          '即将重置谷歌验证码，管理员：' + row.name + ', 是否继续?',
          '重置谷歌二维码提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        ).then(() => {
          reset(row).then((response) => {
            this.$message({
              message: response.message,
              type: 'success',
            })
            this.fetchData()
          })
        })
      },
      refreshList(isHomePage = true) {
        // 首页
        if (isHomePage) {
          this.offset = 0
        }
        this.getAdmins()
      },
      tableSortChange(column) {
        this.order = column.order ? column.order : 'descending'
        this.sort = strToLine(column.prop)
        this.refreshList()
      },
      getAdmins() {
        this.loading = true
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
          guard_name: 'admin',
          ...this.formData,
        }
        if (this.formData.time !== null && this.formData.time[0] !== '') {
          requestData['start_at'] = this.formData.time[0]
        }
        if (this.formData.time !== null && this.formData.time[1] !== '') {
          requestData['end_at'] = this.formData.time[1]
        }
        admins(requestData)
          .then((response) => {
            const { data } = response
            this.loading = false
            this.tableData = data.admins.map(item => {
              item.merchantId = item.merchantId ? String(item.merchantId).split(',') : []
              return item
            })
           //  this.tableData = data.admins
            this.total = data.total
          })
          .catch(() => {
            this.loading = false
            this.tableData = []
            this.total = 0
          })
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
              dictNames: ['roleList', 'merchantList', 'getChannelList'],
            }),
            admins(requestData),
          ])
          .then(
            axios.spread((response1, response2) => {
              console.log(response1.data.getChannelList)
              const { data } = response2
              this.loading = false
            this.tableData = data.admins.map(item => {
              item.merchantId = item.merchantId ? String(item.merchantId).split(',') : []
              return item
            })
             // this.tableData = data.admins

              this.total = data.total
              this.roleList = response1.data.roleList
              this.merchantList = response1.data.merchantList
              this.formColumns.merchantId.options = this.merchantList
              this.channelList = response1.data.getChannelList
              this.formColumns.channelId.options = this.channelList
            })
          )
          .catch(() => {
            this.loading = false
            this.tableData = []
            this.total = 0
          })
      },
      handleShowDialog(row) {
        this.$refs['dialog'].showDialog(row)
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
          this.getAdmins()
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
