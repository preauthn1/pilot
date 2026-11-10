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
        >
          <template #button>
            <el-button
              v-permission="'gameControl.update'"
              type="primary"
              icon="el-icon-circle-plus-outline"
              @click="handleShowDialog"
            >
              {{ $t('common.create') }}
            </el-button>
          </template>
        </base-form>
        <div style="color: red;">*公式乘数越高杀率越高,公式乘数范围(0-9)</div>
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
          <el-table-column prop="channel" label="渠道" >
          <template slot-scope="scope">
              {{ channelList[scope.row.channel] }}
            </template>
          </el-table-column>
          <el-table-column prop="systemId" label="系统配置" >
          <template slot-scope="scope">
              {{ systemList[scope.row.system] }}
            </template>
          </el-table-column>
            <el-table-column
              prop="reserve"
              label="金额"
              :formatter="$util.fenToYuan"
            />
            <el-table-column
              prop="progress"
              label="当前进度"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="rebate" label="公式乘数" />
            <el-table-column prop="gameMax" label="游戏最大结算倍数">
              <template slot-scope="scope">
                {{ parseFloat(scope.row.gameMax / 100).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="620px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'gameControl.update'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleShowDialog(scope.row)"
                >
                  编辑
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
                  v-permission="'gameControl.updateMaintain'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleMaintain(scope.row)"
                >
                  <span v-if="scope.row.gameStatus == 0">开启维护</span>
                  <span v-else>关闭维护</span>
                </el-button>
                <el-button
                  v-permission="'gameControl.updateGameMax'"
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="updateGameMax(scope.row)"
                >
                  设置游戏最大结算倍数
                </el-button>
                <el-button
                  v-permission="'admin.update'"
                  icon="el-icon-circle-plus-outline"
                  type="primary"
                  @click="handleShowCopy(scope.row,true)"
                >
                一键添加
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
    <game-control-edit
        ref="dialog"
        :system-list="systemList"
        :channel-list="channelList"
        @fetch-data="refreshList"
    />
  </div>
</template>

<script>
  import BaseForm from '@/components/BaseForm'
  import { stopGame } from '@/api/game-setting'
  import { getGameControlList,updateGameMax, updateMaintain } from '@/api/game_control'
  import GameControlEdit from './components/GameControlEdit'
  import Pagination from '@/components/Pagination'
  import { strToLine } from '@/utils'
  import { dictMaps } from '@/api/common'
  import axios from 'axios'
  export default {
    name: 'GameControl',
    components: { Pagination, GameControlEdit,BaseForm },
    data() {
      return {
        total: 0,
        loading: true,
        order: 'descending',
        sort: 'created_at',
        offset: 0,
        limit: 10,
        tableData: [],
        channelList:{},
        systemList:{},
        formAttr: {
          title: 'search',
          isInline: true,
          submitButtonText: this.$t('common.search'),
          showReset: true,
          showCancel: false,
          labelWidth: '',
        },
        formData: {
          channel: '',
          system: '',
        },
        formColumns: {
          channel: {
            prop: 'channel',
            label: '渠道',
            type: 'select',
            options: this.channelList,
          },
          system: {
            prop: 'system',
            label: '系统配置',
            type: 'select',
            options: this.systemList,
          },
        },
      }
    },
    mounted() {
      this.fetchAll()
    },
    methods: {
      handleShowCopy(row){
        this.$refs['dialog'].showDialog(row,true)
      },
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
            updateMaintain({ id: row.id, gameStatus: gameStatus ,channel:row.channel}).then(
              (response) => {
                this.$message({
                  type: 'success',
                  message: response.message,
                })
                this.fetchAll()
              }
            )
          })
          .catch(() => {
          })
      },
      handleStopGame(row) {
        this.$confirm('确定停止游戏吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            stopGame({id:row.id ,channel:row.channel}).then((response) => {
              this.$message({
                type: 'success',
                message: response.message,
              })
              this.fetchAll()
            })
          })
          .catch(() => {
          })
      },
      updateGameMax(row){
        this.$prompt('请输入倍数', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
          }).then(({ value }) => {
            this.loading=true
            updateGameMax({ id:row.id,game_max: value * 100, channel:row.channel })
              .then((response) => {
                this.loading = false
                this.$message({
                  type: 'success',
                  message: response.message,
                });
                this.fetchAll()
              })
              .finally(() => {
                this.loading = false
              })
          }).catch(() => {
          });
      },
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
          ...this.formData,
        }
        axios
          .all([
            dictMaps({
              dictNames: ['getChannelList','getSystem'],
            }),
            getGameControlList(requestData),
          ])
          .then(
            axios.spread((response1,response) => {
              console.log(response)
                const { data } = response
                this.loading = false
                this.tableData = data.list
                this.total = data.total
                this.channelList = response1.data.getChannelList
                this.systemList = response1.data.getSystem
                this.formColumns.channel.options = response1.data.getChannelList
                this.formColumns.system.options = response1.data.getSystem
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
