<template>
  <div class="app-container">
    <el-row>
      <el-col :span="24" class="margin-t-10" style="margin-bottom: 10px">
        <base-form
          :form-attr="formAttr"
          :form-data.sync="formData"
          :form-columns="formColumns"
          @handle-submit="refreshList"
          @handle-refresh="refreshList"
        />
        <el-button
          v-permission="'user.openAll'"
          type="primary"
          icon="el-icon-circle-plus-outline"
          @click="handleOpenAll"
        >
          批量解锁
        </el-button>
        <el-button
          v-permission="'user.outAll'"
          icon="el-icon-edit-outline"
          type="primary"
          @click="handleOutAll"
        >
          踢出所有玩家
        </el-button>
        <el-button
          type="primary"
          :loading="downloadLoading"
          @click="handleDownload"
        >
          导出
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
            @sort-change="tableSortChange"
          >
            <el-table-column prop="merchantId" label="商户">
              <template slot-scope="scope">
                {{ merchantList[scope.row.merchantId] }}
              </template>
            </el-table-column>
            <el-table-column prop="channelId" label="渠道">
              <template slot-scope="scope">
                {{ channelList[scope.row.channelId] }}
              </template>
            </el-table-column>
            <el-table-column prop="username" label="玩家账号" />
            <el-table-column
              prop="coin"
              label="余额"
              :formatter="$util.fenToYuan"
            />
            <el-table-column
              prop="totalProfitAndLoss"
              label="总盈亏"
              :formatter="$util.fenToYuan"
            />
            <el-table-column
              prop="totalBets"
              label="总投注"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="freeBetEnabled" label="免费下注">
              <template slot-scope="scope">
                <span v-if="scope.row.freeBetEnabled === 1" style="color: #5daf34">开启</span>
                <span v-else>关闭</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="freeBetRemain"
              label="免费剩余次数"
            />
            <el-table-column
              prop="freeBetAmount"
              label="免费单次金额（元）"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="loginTime" label="登录时间" />
            <el-table-column
              prop="bringInAmount"
              label="带入金额"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="outTime" label="退出时间" />
            <el-table-column
              prop="bringOutAmount"
              label="带出金额"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="online" label="在线状态">
              <template slot-scope="scope">
                <span v-if="scope.row.online == 1" style="color: #5daf34">
                  {{ onlineList[scope.row.online] }}
                </span>
                <span v-else>
                  {{ onlineList[scope.row.online] }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="isLock" label="锁定">
              <template slot-scope="scope">
                <span v-if="scope.row.isLock == 1" style="color: #5daf34">
                  {{ isLockList[scope.row.isLock] }}
                </span>
                <span v-else>
                  {{ isLockList[scope.row.isLock] }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="账号状态">
              <template slot-scope="scope">
                <span v-if="scope.row.status == 0" style="color: #5daf34">
                  {{ statusList[scope.row.status] }}
                </span>
                <span v-else>
                  {{ statusList[scope.row.status] }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="600px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'user.outGame'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleOffline(scope.row)"
                >
                  踢下线
                </el-button>
                <el-button
                  v-permission="'user.updateUserStatus'"
                  icon="el-icon-edit-outline"
                  @click="handleDisabled(scope.row)"
                >
                  <span v-if="scope.row.status == 0" style="color: red">
                    禁用
                  </span>
                  <span v-else>启用</span>
                </el-button>
                <el-button
                  v-permission="'user.openAll'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleOpenAll(scope.row)"
                >
                  解锁玩家
                </el-button>
                <el-button
                  type="primary" v-if="scope.row.coin>0 && scope.row.online != 1"
                  @click="handleDownPoint(scope.row)"
                >
                  下分
                </el-button>
                <el-button
                  type="success" v-if="scope.row.freeBetEnabled === 1"
                  @click="handleGrantFreeBet(scope.row)"
                >
                  发放免费次数
                </el-button>
                <!--                <el-button-->
                <!--                  v-permission="'admin.update'"-->
                <!--                  icon="el-icon-edit-outline"-->
                <!--                  type="primary"-->
                <!--                  @click="handleAddCoin(scope.row)"-->
                <!--                >-->
                <!--                  上分-->
                <!--                </el-button>-->
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
  import BaseForm from '@/components/BaseForm'
  import {
    getUserList,
    outGame,
    updateUserStatus,
    addCoin,
    openAll,
    grantFreeBet,
  } from '@/api/user'
  import { DefaultTimeToday, rTime } from '@/utils'
  import axios from 'axios'
  import { dictMaps } from '@/api/common'
  import { outAll } from '@/api/game-setting'
  import { downPoint } from '@/api/user/index'
  export default {
    name: 'User',
    components: { Pagination, BaseForm },
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
        channelList: {},
        onlineList: {},
        isLockList: {},
        statusList: {},
        downloadLoading: false,
        billingTypeList: {
          0: '系统自动',
          1: '系统手动',
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
          merchantId: '',
          channelId: '',
          username: '',
          online: '',
          isLock: '',
          status: '',
          time: '',
          coin:0,
        },
        formColumns: {
          merchantId: {
            prop: 'merchantId',
            label: '商户',
            type: 'select',
            options: this.merchantList,
          },
          channelId: {
            prop: 'channelId',
            label: '渠道',
            type: 'select',
            options: this.channelList,
          },
          username: {
            prop: 'username',
            label: '玩家账号',
            type: 'text',
          },
          online: {
            prop: 'online',
            label: '在线状态',
            type: 'select',
            options: this.onlineList,
          },
          isLock: {
            prop: 'isLock',
            label: '锁定状态',
            type: 'select',
            options: this.isLockList,
          },
          status: {
            prop: 'status',
            label: '账号状态',
            type: 'select',
            options: this.statusList,
          },
          time: {
            prop: 'time',
            label: '日期',
            type: 'datePicker',
          },
          coin: {
            prop: 'coin',
            label: '余额>0',
            type: 'switch',
          },
        },
      }
    },
    mounted() {
      this.formData.time = DefaultTimeToday()
      this.fetchAll()
    },
    methods: {
      //点击下分
        handleDownPoint(res){
        axios.get('https://api.afgames.games/api/thirdGame/transferOut/pilot?username='+res.username).then(res1=>{
          if(res1.data.code == 0){
            this.$message({
              type: 'success',
              message: '下分成功',
            })
          }else{
             this.$message({
              type: 'info',
              message: res1.data.msg,
            })
          }
        }).catch((error)=>{
           this.$message({
              type: 'error',
              message: '请求失败',
            })
        })
        //  let res1 = await downPoint(query);


      },
      // 发放免费次数
      handleGrantFreeBet(row) {
        this.$prompt(
          '为 ' + row.username + ' 发放免费下注次数',
          '发放免费次数',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputPattern: /^[1-9]\d*$/,
            inputErrorMessage: '请输入正整数',
          }
        )
          .then(({ value }) => {
            const count = parseInt(value)
            grantFreeBet({
              userId: row.id,
              channelId: row.channelId,
              count: count,
            })
              .then((response) => {
                this.$message({
                  type: 'success',
                  message: response.msg || '发放成功',
                })
                this.getList()
              })
              .catch(() => {
                this.$message({
                  type: 'error',
                  message: '发放失败',
                })
              })
          })
          .catch(() => {})
      },
      handleOffline(row) {
        this.$confirm(
          '确定将用户名为' + row.username + '的玩家踢下线?',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
          .then(() => {
            outGame({ userId: row.id }).then((response) => {
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
      handleDisabled(row) {
        this.$confirm('确定将用户名为' + row.username + '的玩家封号?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            var status = row.status == 1 ? 0 : 1
            updateUserStatus({ userId: row.id, status: status }).then(
              (response) => {
                this.$message({
                  type: 'success',
                  message: response.message,
                })
                this.getList()
              }
            )
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消',
            })
            this.getList()
          })
      },
      handleOpenAll(row) {
        var msg = ''
        var data = {}
        if (row.id) {
          msg = '确定将用户名' + row.username + '的玩家解锁吗?'
          data = { userId: row.id }
        } else {
          msg = '确定为所有锁定玩家解锁吗？'
        }
        this.$confirm(msg, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            openAll(data).then((response) => {
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
      handleAddCoin(row) {
        this.$prompt('请输入上分金币', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
        })
          .then(({ value }) => {
            addCoin({
              channel_id: row.channelId,
              username: row.username,
              money: value * 100,
            }).then((response) => {
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
              message: response.message,
            })
            this.getList()
          })
      },
      handleOutAll() {
        this.$confirm('确定踢出所有玩家吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            outAll().then((response) => {
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
      fetchAll() {
        this.loading = true
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
          ...this.formData,
        }
        if (
          this.formData.time !== null &&
          rTime(this.formData.time[0]) !== ''
        ) {
          requestData['start_at'] = rTime(this.formData.time[0])
        }
        if (
          this.formData.time !== null &&
          rTime(this.formData.time[1]) !== ''
        ) {
          requestData['end_at'] = rTime(this.formData.time[1])
        }
        axios
          .all([
            dictMaps({
              dictNames: ['merchantList', 'getChannelList'],
            }),
            getUserList(requestData),
          ])
          .then(
            axios.spread((response1, response2) => {
              const { data } = response2
              this.loading = false
              this.tableData = data.list
              this.total = data.total
              this.merchantList = response1.data.merchantList
              this.formColumns.merchantId.options = this.merchantList
              this.channelList = response1.data.getChannelList
              this.formColumns.channelId.options = this.channelList
              this.onlineList = { 0: '离线', 1: '在线' }
              this.formColumns.online.options = this.onlineList
              this.statusList = { 0: '启用', 1: '禁用' }
              this.formColumns.status.options = this.statusList
              this.isLockList = { 0: '未锁定', 1: '锁定' }
              this.formColumns.isLock.options = this.isLockList
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
        if (
          this.formData.time !== null &&
          rTime(this.formData.time[0]) !== ''
        ) {
          requestData['start_at'] = rTime(this.formData.time[0])
        }
        if (
          this.formData.time !== null &&
          rTime(this.formData.time[1]) !== ''
        ) {
          requestData['end_at'] = rTime(this.formData.time[1])
        }
        getUserList(requestData)
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
      handleShowDialog(row) {
        this.$refs['dialog'].showDialog(row)
      },
      handleDownload() {
        this.$baseConfirm('你确定要导出用户列表吗？', null, () => {
          this.downloadLoading = true
          const requestData = {
            offset: this.offset,
            limit: this.total,
            order: this.order,
            sort: this.sort,
            ...this.formData,
          }
          if (
            this.formData.time !== null &&
            rTime(this.formData.time[0]) !== ''
          ) {
            requestData['start_at'] = rTime(this.formData.time[0])
          }
          if (
            this.formData.time !== null &&
            rTime(this.formData.time[1]) !== ''
          ) {
            requestData['end_at'] = rTime(this.formData.time[1])
          }
          getUserList(requestData)
            .then((response) => {
              this.excelList = response.data.list
              import('@/utils/excel').then((excel) => {
                const tHeader = [
                  '商户',
                  '渠道',
                  '玩家账号',
                  '余额',
                  '总盈亏',
                  '总投注',
                  '免费下注',
                  '免费剩余次数',
                  '免费单次金额',
                  '登录时间',
                  '带入金额',
                  '退出时间',
                  '带出金额',
                  '在线状态',
                  '是否锁定',
                  '账号状态',
                ]
                const filterVal = [
                  'merchantName',
                  'channelId',
                  'username',
                  'coin',
                  'totalProfitAndLoss',
                  'totalBets',
                  'freeBetEnabled',
                  'freeBetRemain',
                  'freeBetAmount',
                  'loginTime',
                  'bringInAmount',
                  'outTime',
                  'bringOutAmount',
                  'online',
                  'isLock',
                  'status',
                ]
                const list = this.excelList
                const data = this.formatJson(filterVal, list)
                excel.export_json_to_excel({
                  header: tHeader,
                  data,
                  filename: this.filename,
                  autoWidth: this.autoWidth,
                  bookType: this.bookType,
                })
                this.downloadLoading = false
              })
            })
            .catch(() => {
              this.downloadLoading = false
            })
        })
      },
      formatJson(filterVal, jsonData) {
        return jsonData.map((v) =>
          filterVal.map((j) => {
            if (j === 'channelId') {
              v[j] = this.channelList[v[j]]
            } else if (j === 'freeBetEnabled') {
              v[j] = v[j] === 1 ? '开启' : '关闭'
            } else if (
              j === 'coin' ||
              j === 'totalProfitAndLoss' ||
              j === 'bringInAmount' ||
              j === 'bringOutAmount' ||
              j === 'freeBetAmount'
            ) {
              v[j] = v[j] / 100
            }
            return v[j]
          })
        )
      },
    },
  }
</script>
