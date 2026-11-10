<template>
  <div class="app-container">
    <el-row>
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
            @handle-refresh="tableSortChange"
          >
            <el-table-column prop="gameMax" label="游戏最大结算倍数">
              <template slot-scope="scope">
                {{ parseFloat(scope.row.gameMax / 100).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="gameStatus" label="游戏状态">
              <template slot-scope="scope">
                {{ gameStatusList[scope.row.gameStatus] }}
              </template>
            </el-table-column>
            <el-table-column prop="coinSwitch" label="游戏中上分开关">
              <template slot-scope="scope">
                {{ coinSwitchList[scope.row.coinSwitch] }}
              </template>
            </el-table-column>
            <el-table-column prop="lowerScoreSwitch" label="游戏中下分开关">
              <template slot-scope="scope">
                {{ lowerScoreSwitchList[scope.row.lowerScoreSwitch] }}
              </template>
            </el-table-column>

            <el-table-column label="操作" width="650px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'gameControl.updateGameMax'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleShowDialog(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-permission="'gameControl.updateMaintain'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleMaintain(scope.row)"
                >
                  <span v-if="scope.row.gameStatus == 0">开启维护</span>
                  <span v-else>关闭维护</span>
                </el-button>
                <el-button
                  v-permission="'user.stopGame'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleStopGame(scope.row)"
                >
                  停止游戏
                </el-button>
                <el-button
                  v-permission="'gameControl.updateAddCoinStatus'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleCoinSwitch(scope.row)"
                >
                  游戏中上分开关
                </el-button>
                <el-button
                  v-permission="'gameControl.updateLowerCoinStatus'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleLowerScoreSwitch(scope.row)"
                >
                  游戏中下分开关
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
            @pagination="fetchAll"
          />
        </el-col>
      </el-col>
    </el-row>
    <dialog-form
      ref="dialogFrom"
      :loading="loading"
      :form-attr="formAttr"
      :form-data="formData"
      :form-columns="formColumns"
      @handle-submit="onSave"
    />
  </div>
</template>

<script>
  import Pagination from '@/components/Pagination'
  import DialogForm from '@/components/DialogForm'
  import { deepCopy, strToLine } from '@/utils'
  import { stopGame } from '@/api/game-setting'
  import { dictMaps } from '@/api/common'
  import {
    getGameControlSettingList,
    updateMaintain,
    updateAddCoinStatus,
    updateGameMax,
    updateLowerCoinStatus,
  } from '@/api/game_control_setting'

  export default {
    name: 'GameControlSetting',
    components: { Pagination, DialogForm },
    data() {
      return {
        total: 0,
        loading: true,
        order: 'descending',
        sort: 'created_at',
        offset: 0,
        limit: 10,
        tableData: [],
        channelList: {},
        gameStatusList: {
          0: '正常',
          1: '维护中',
        },
        coinSwitchList: {
          0: '关闭',
          1: '开启',
        },
        lowerScoreSwitchList: {
          0: '关闭',
          1: '开启',
        },
        formAttr: {
          title: '编辑',
          isInline: false,
          submitButtonText: '确定',
          showReset: false,
          showCancel: true,
          labelWidth: '100px',
        },
        formData: {
          id: 0,
          gameMax: '',
        },
        formColumns: {
          gameMax: {
            prop: 'gameMax',
            label: '游戏最大结算倍数',
            type: 'text',
            optionType: 'number',
          },
        },
      }
    },
    mounted() {
      this.fetchAll()
    },
    methods: {
      handleMaintain(row) {
        var s = '开启'
        if (row.gameStatus == 1) {
          s = '关闭'
        }
        this.$confirm('确定' + s + '维护吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            var gameStatus = row.gameStatus == 1 ? 0 : 1
            updateMaintain({ id: row.id, gameStatus: gameStatus }).then(
              (response) => {
                this.$message({
                  type: 'success',
                  message: response.msg || '操作成功',
                })
                this.fetchAll()
              }
            )
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消',
            })
            this.fetchAll()
          })
      },
      handleStopGame(row) {
        this.$confirm('确定停止游戏吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            stopGame({ id: row.id }).then((response) => {
              this.$message({
                type: 'success',
                message: response.msg || '操作成功',
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
      handleCoinSwitch(row) {
        var s = '开启'
        if (row.coinSwitch == 1) {
          s = '关闭'
        }
        this.$confirm('确定' + s + '游戏中上分吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            var coinSwitch = row.coinSwitch == 1 ? 0 : 1
            updateAddCoinStatus({ id: row.id, coinSwitch: coinSwitch }).then(
              (response) => {
                this.$message({
                  type: 'success',
                  message: response.msg || '操作成功',
                })
                this.fetchAll()
              }
            )
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消',
            })
            this.fetchAll()
          })
      },
      handleLowerScoreSwitch(row) {
        var s = '开启'
        if (row.lowerScoreSwitch == 1) {
          s = '关闭'
        }
        this.$confirm('确定' + s + '游戏中下分吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            var lowerScoreSwitch = row.lowerScoreSwitch == 1 ? 0 : 1
            updateLowerCoinStatus({
              id: row.id,
              lowerScoreSwitch: lowerScoreSwitch,
            }).then((response) => {
              this.$message({
                type: 'success',
                message: response.msg || '操作成功',
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
        }
        getGameControlSettingList(requestData)
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

      tableSortChange(column) {
        this.order = column.order ? column.order : 'descending'
        this.sort = strToLine(column.prop)
        this.offset = 0
        this.fetchAll()
      },
      handleShowDialog(row) {
        deepCopy(this.formData, row)
        this.formData.gameMax = row.gameMax / 100
        this.$refs['dialogFrom'].showDialog()
      },
      onSave(data) {
        this.loading = true
        data.gameMax *= 100
        updateGameMax({
          ...data,
        })
          .then((response) => {
            this.$message({
              message: response.msg || '操作成功',
              type: 'success',
            })
            this.fetchAll()
            this.$refs['dialogFrom'].handleClose()
          })
          .finally(() => {
            this.loading = false
          })
      },
    },
  }
</script>
