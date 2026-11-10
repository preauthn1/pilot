<template>
  <div class="app-container">
    <template>
      <el-row style="margin-bottom: 10px;">
        <el-button type="primary" icon="el-icon-circle-plus-outline"  @click="handleShowDialog">创建机器人</el-button>
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
            <el-table-column prop="channel" label="渠道" >
            <template slot-scope="scope">
                {{ channelList[scope.row.channel] }}
              </template>
            </el-table-column>
            <el-table-column prop="system" label="系统" >
            <template slot-scope="scope">
                {{ systemlLst[scope.row.system] }}
              </template>
            </el-table-column>
            <el-table-column prop="channel" label="结算倍数范围" />
            <el-table-column prop="multipleRange" label="结算倍数范围" />
            <el-table-column prop="betRange" label="机器人下注范围" />
            <el-table-column prop="bettingOdds" label="投注几率" />
            <el-table-column prop="robotNumber" label="机器人数量" />

            <!--            <el-table-column-->
            <!--              prop="createdAt"-->
            <!--              label="创建时间"-->
            <!--              :formatter="$util.cellTimeFormat"-->
            <!--              sortable-->
            <!--            />-->
            <!--            <el-table-column-->
            <!--              prop="updatedAt"-->
            <!--              label="更新时间"-->
            <!--              :formatter="$util.cellTimeFormat"-->
            <!--              sortable-->
            <!--            />-->
            <el-table-column label="操作" width="220px">
              <template slot-scope="scope">
                <el-button
                  v-permission="'robotSetting.update'"
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
  import { getRobotList, updateRobot, addRobot } from '@/api/game-setting'
  import { dictMaps } from '@/api/common'

  export default {
    name: 'RobotSetting',
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
        channelList:{},
        systemlLst:{},
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
          multipleRange: '',
          betRange: '',
          bettingOdds: '',
          robotNumber: '',
          channel:'',
          system:'',
        },
        formColumns: {
          channel: {
            prop: 'channel',
            label: '所属渠道',
            type: 'select',
            options: this.channelList,
            change: this.currencyChange,
            rules: ['required'],
          },
          system: {
            prop: 'system',
            label: '系统配置',
            type: 'select',
            options: this.systemlLst,
            change: this.currencySystem,
            rules: ['required'],
          },
          multipleRange: {
            prop: 'multipleRange',
            label: '结算倍数范围',
            type: 'textarea',
            optionType: 'string',
            placeholder: '例如:2,50;10,30 注:最后不要加;号',
            rules: ['required'],
          },
          betRange: {
            prop: 'betRange',
            label: '机器人下注范围',
            type: 'textarea',
            optionType: 'string',
            placeholder:
              '例如:10, 20 ,50; 10, 20 ,50  （10 下注基数，20 最大下注倍数，50 权重）注:最后不要加;号',
            rules: ['required'],
          },
          bettingOdds: {
            prop: 'bettingOdds',
            label: '投注几率',
            type: 'text',
            optionType: 'number',
            rules: ['required'],
          },
          robotNumber: {
            prop: 'robotNumber',
            label: '机器人数量',
            type: 'text',
            optionType: 'int',
            rules: ['required'],
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
        getRobotList(requestData)
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
        dictMaps({
          dictNames: ['getChannelList', 'getSystem'],
        })
          .then((response) => {
            this.channelList = response.data.getChannelList
            this.systemlLst = response.data.getSystem
            this.formColumns.channel.options = this.channelList
            this.formColumns.system.options = this.systemlLst
          })
          .catch(() => {})
      },
      fetchData() {
        this.loading = true
        const requestData = {
          offset: this.offset,
          limit: this.limit,
          order: this.order,
          sort: this.sort,
        }
        getRobotList(requestData)
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
        if(row && row.id){
          if(onkey){
            deepCopy(this.formData, row)
            this.formData.id=0
          }else{
            deepCopy(this.formData, row)
          }
          
        }else{
          this.formData.multipleRange = ''
          this.formData.betRange = ''
          this.formData.bettingOdds = ''
          this.formData.robotNumber = ''
          this.formData.channel = ''
          this.formData.system = ''
        }
        this.$refs['dialogFrom'].showDialog()
      },
      onSave(data) {
        this.loading = true
        let func = (this.formData.id > 0) ? updateRobot : addRobot
        func({ ...data })
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
      },
    },
  }
</script>
