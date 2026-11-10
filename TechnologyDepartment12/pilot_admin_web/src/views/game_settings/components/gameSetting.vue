<template>
  <div class="app-container">
    <template>
      <el-row style="margin-bottom: 10px;">
        <el-select v-model="channelLists" placeholder="渠道选择" @change="yyy">
            <el-option
              v-for="(value, key,index) in channelList"
              :key="index"
              :label="value"
              :value="key">
            </el-option>
        </el-select>
        <el-button type="primary" icon="el-icon-circle-plus-outline"  @click="fetchData" style="margin-left: 10px;">查询</el-button>
        <el-button type="primary" icon="el-icon-circle-plus-outline"  @click="handleShowDialog">添加配置</el-button>
      </el-row>
    </template>
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
            <el-table-column
              prop="initialBet"
              label="初始投注金额"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="btnBet" label="按钮金额列表" />
            <el-table-column prop="amplitude" label="递增减幅度" />
            <el-table-column prop="channel" label="渠道" >
            <template slot-scope="scope">
                {{ channelList[scope.row.channel] }}
              </template>
            </el-table-column>
            <el-table-column prop="system" label="系统配置" >
              <template slot-scope="scope">
                {{ system[scope.row.system] || scope.row.system || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="ruleContent" label="规则" />
            <el-table-column prop="freeBetEnabled" label="开启免费下注">
              <template slot-scope="scope">
                {{ scope.row.freeBetEnabled === 1 ? '开启' : '关闭' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="freeBetAmount"
              label="免费单次金额（元）"
              :formatter="$util.fenToYuan"
            />
            <el-table-column prop="betMin" label="投注金额范围">
              <template slot-scope="scope">
                {{ parseFloat(scope.row.betMin / 100).toFixed(2) }}~{{
                  parseFloat(scope.row.betMax / 100).toFixed(2)
                }}
              </template>
            </el-table-column>
            <el-table-column prop="settlementMin" label="自动结算倍数范围">
              <template slot-scope="scope">
                {{ scope.row.settlementMin }}~{{ scope.row.settlementMax }}
              </template>
            </el-table-column>
            <el-table-column label="操作"  width="220px">
              <template slot-scope="scope">
                <el-button
                  icon="el-icon-edit-outline"
                  type="primary"
                  @click="handleShowDialog(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-permission="'admin.update'"
                  icon="el-icon-circle-plus-outline"
                  type="primary"
                  @click="handleShowDialog(scope.row,true)"
                >
                一键添加
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
            @pagination="fetchData"
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

  import { dictMaps } from '@/api/common'
  import { getSystemConfigList } from '@/api/system-config'
  import {
    getGameList,
    update,
    updateMaintain,
    stopGame,
    outAll,
    add,
  } from '@/api/game-setting'





  export default {
    name: 'GameSetting',
    components: { Pagination, DialogForm },
    data() {
      return {
        channelLists:'',
        action:'',
        total: 0,
        loading: true,
        order: 'descending',
        sort: 'created_at',
        offset: 0,
        limit: 10,
        tableData: [],
        channelList:{},
        system:{},
        channel:'',
        gameStatusList: {
          0: '正常',
          1: '维护中',
        },
        formAttr: {
          title: '编辑',
          isInline: false,
          submitButtonText: '确定',
          showReset: false,
          showCancel: true,
          labelWidth: '140px',
        },
        formData: {
          id: 0,
          initialBet: '',
          btnBet: '',
          amplitude: '',
          betMin: '',
          betMax: '',
          settlementMin: '',
          settlementMax: '',
          gameMax: '',
          channel:'',
          ruleContent:'',
          system:'',
          freeBetEnabled: 1,
          freeBetAmount: '',
        },
        formColumns: {
          channel: {
            prop: 'channel',
            label: '所属渠道',
            type: 'select',
            options: this.channelList,
            change: this.currencyChange,
          },
          system: {
            prop: 'system',
            label: '系统配置',
            type: 'select',
            options: this.system,
            //change: this.currencySystem,
          },
          initialBet: {
            prop: 'initialBet',
            label: '初始投注金额',
            type: 'text',
            optionType: 'string',
          },
          btnBet: {
            prop: 'btnBet',
            label: '按钮金额列表',
            type: 'text',
            optionType: 'string',
            placeholder: '例如:1,5,10',
          },
          amplitude: {
            prop: 'amplitude',
            label: '递增减幅度',
            type: 'text',
            optionType: 'string',
          },
          betMin: {
            prop: 'betMin',
            label: '最小投注金额',
            type: 'text',
            optionType: 'number',
          },
          betMax: {
            prop: 'betMax',
            label: '最大投注金额',
            type: 'text',
            optionType: 'number',
          },
          settlementMin: {
            prop: 'settlementMin',
            label: '最小自动结算倍数',
            type: 'text',
            optionType: 'number',
          },
          settlementMax: {
            prop: 'settlementMax',
            label: '最大自动结算倍数',
            type: 'text',
            optionType: 'number',
          },
          ruleContent: {
            prop: 'ruleContent',
            label: '规则内容',
            type: 'textarea',
            optionType: 'string',
          },
          gameMax: {
            prop: 'gameMax',
            label: '单局最高限额',
            type: 'text',
            optionType: 'number',
            hidden: true,
          },
          freeBetEnabled: {
            prop: 'freeBetEnabled',
            label: '开启免费下注',
            type: 'select',
            optionType: 'int',
            options: { 0: '关闭', 1: '开启' },
          },
          freeBetAmount: {
            prop: 'freeBetAmount',
            label: '免费单次金额（元）',
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
      fetchAll() {
        this.loading = true
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
        }
        // 获取游戏列表（核心数据，失败才清空）
        getGameList(requestData)
          .then((response) => {
            const { data } = response
            this.tableData = data.list
            this.total = data.total
          })
          .catch(() => {
            this.tableData = []
            this.total = 0
          })
          .finally(() => {
            this.loading = false
          })
        // 单独获取字典数据（不影响表格显示）
        dictMaps({
          dictNames: ['getChannelList', 'getSystem'],
        })
          .then((response) => {
            this.channelList = response.data.getChannelList
            this.formColumns.channel.options = this.channelList
            this.system = response.data.getSystem
            this.formColumns.system.options = response.data.getSystem
          })
          .catch(() => {
            // 字典数据获取失败不处理，使用空对象兜底
          })
      },

      fetchData() {
        this.loading = true
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
          channel:this.channel,
        }
        getGameList(requestData)
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
        this.fetchData()
      },
      handleShowDialog(row,onkey) {
        if (row && row.id) {
          Object.assign(this.formData, {
            id: row.id,
            btnBet: row.btnBet,
            amplitude: row.amplitude,
            channel: row.channel,
            system: row.system,
          })
          if(onkey){
            this.action = 'add'
            this.formData.id=0
          }else{
             this.action = 'edit'
          }
            this.formData.initialBet = row.initialBet / 100
            this.formData.betMin = row.betMin / 100
            this.formData.betMax = row.betMax / 100
            this.formData.settlementMin = row.settlementMin
            this.formData.settlementMax = row.settlementMax
            this.formData.gameMax = row.gameMax
            this.formData.ruleContent = row.ruleContent
            this.formData.freeBetEnabled = row.freeBetEnabled != null ? row.freeBetEnabled : 1
            this.formData.freeBetAmount = row.freeBetAmount != null ? row.freeBetAmount / 100 : ''
         
        }else{
          //创建
          this.action = 'add'
          this.formData.initialBet = ''
          this.formData.betMin = ''
          this.formData.betMax = ''
          this.formData.settlementMin = ''
          this.formData.settlementMax = ''
          this.formData.gameMax = ''
          this.formData.btnBet = ''
          this.formData.amplitude = ''
          this.formData.ruleContent = ''
          this.formData.freeBetEnabled = 1
          this.formData.freeBetAmount = ''
        }
        this.$refs['dialogFrom'].showDialog()
      },
      onSave(data) {
        this.loading = true
        data.initialBet *= 100
        data.betMin *= 100
        data.betMax *= 100
        if (data.freeBetAmount !== '' && data.freeBetAmount != null) {
          data.freeBetAmount *= 100
        }
        if (this.action === 'edit') {
          update({
            ...data,
          })
          .then((response) => {
            this.$message({
              message: response.msg || '操作成功',
              type: 'success',
            })
            this.fetchData()
            this.$refs['dialogFrom'].handleClose()
          })
          .finally(() => {
            this.loading = false
          })
        }else{
          add({
            ...data,
          })
          .then((response) => {
            this.$message({
              message: response.msg || '操作成功',
              type: 'success',
            })
            this.fetchData()
            this.$refs['dialogFrom'].handleClose()
          })
          .finally(() => {
            this.loading = false
          })
        }

      },
      yyy(val){
         this.channel = val;
      },
      currencyChange(val){
        this.formData.channel = val;
      }
    },
  }
</script>
