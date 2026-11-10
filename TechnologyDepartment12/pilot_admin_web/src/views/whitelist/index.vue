<template>
  <div class="app-container">
    <el-row>
      <el-col :span="24" style="padding-bottom: 10px">
        <el-button
          type="danger"
          icon="el-icon-delete"
          @click="handleDeleteAll"
        >
          批量删除
        </el-button>
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
            @selection-change="handleSelectionChange"
          >
          <el-table-column
            type="selection"
            width="55">
          </el-table-column>
            <el-table-column prop="ip" label="IP地址" />
            <el-table-column prop="adminStatus" label="后台状态">
              <template slot-scope="scope">
                
                <el-button type="primary" v-if="scope.row.adminStatus == 1" @click="adminStatus(scope.row,0)">白名单</el-button>
                <el-button type="danger" v-else @click="adminStatus(scope.row,1)">黑名单</el-button>
              </template>
            </el-table-column>
            <el-table-column prop="apiStatus" label="api状态">
              <template slot-scope="scope">
                <el-button type="primary" v-if="scope.row.apiStatus == 1" @click="apiStatus(scope.row,0)">白名单</el-button>
                <el-button type="danger" v-else @click="apiStatus(scope.row,1)">黑名单</el-button>
              </template>
            </el-table-column>
            <!-- <el-table-column prop="secret" label="密钥" /> -->
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
                <el-button
                  type="danger"
                  icon="el-icon-delete"
                  @click="signDelete(scope.row)"
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
            @pagination="getList"
          />
        </el-col>
      </el-col>
    </el-row>
  
    <white-edit
      ref="dialog"
      :status-list="statusList"
      :channel-list="channelList"
      @fetch-data="refreshList"
    />
  </div>
</template>

<script>
  import { getIpList, del, update } from '@/api/whitelist'
  import whiteEdit from './components/whiteEdit'
  import Pagination from '@/components/Pagination'
  import BaseForm from '@/components/BaseForm'
  import axios from 'axios'
  import { dictMaps } from '@/api/common'

  export default {
    name: 'whitelist',
    components: { whiteEdit, Pagination, BaseForm },
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
        statusList: {
          0: '维护',
          1: '开启',
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
          channel: '',
        },
        formColumns: {
          channel: {
            prop: 'channel',
            label: '所属渠道',
            type: 'select',
            options: this.channelList,
          },
         
        },
        selectAll:[],
        // formData: {
        //     id:0,
        //     ip: '',
        //     admin_status:0,
        //     api_status:0,
        //     remarks:''
        //   },
      }
    },
    mounted() {
      this.fetchAll()
    },
    methods: {
      async apiStatus(row,val){
        let query={
            id:0,
            ip: '',
            // admin_status:0,
            // api_status:0,
            remarks:''
        }
        for(var key in query){
          query[key] = row[key]
        }
        query.admin_status = row.adminStatus;
        query.api_status = val;
        let res = await update(query);
        if(res.code ==0){
          this.$message({
                message: res.message,
                type: 'success',
          })
          this.fetchAll()
        }
       
      },
     async adminStatus(row,val){
        let query={
            id:0,
            ip: '',
            // admin_status:0,
            // api_status:0,
            remarks:''
        }
        for(var key in query){
          query[key] = row[key]
        }
        query.api_status = row.apiStatus;
        query.admin_status = val;
        let res = await update(query);
        if(res.code ==0){
          this.$message({
                message: res.message,
                type: 'success',
          })
          this.fetchAll()
        }
      },
       //是否删除
       isDelete(row){
            this.$confirm('是否删除？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // this.$message({
                //     type: 'success',
                //     message: '删除成功!'
                // });
                this.deleteItem(row.id);
            }).catch(() => {
                // this.$message({
                //     type: 'info',
                //     message: '已取消删除'
                // });          
            });
        },
      //单个删除
      signDelete(row){
        this.isDelete(row);
      },
    async deleteItem(id){
        let res = await del({id});
        if(res.code == 0){
          this.$message({
                type: 'success',
                message: '删除成功!'
            });
            this.fetchAll()
        }else{
          this.$message({
                type: 'error',
                message: '删除失败'
            }); 
        }
      },
      //批量删除
      handleDeleteAll(){
        console.log(this.selectAll)
        if(this.selectAll.length <= 0){
          this.$message({
                type: 'info',
                message: '请选择ip'
            }); 
          return;
          }
         let ids = this.selectAll.map(item=>item.id).join(',')
         let obj={
          id:ids
         }
        this.isDelete(obj);
       
      },
      handleSelectionChange(e){
        this.selectAll = e;
      },
      refreshList(isHomePage = true) {
        // 首页
        if (isHomePage) {
          this.offset = 0
        }
        this.fetchAll()
      },
      async fetchAll() {
        this.loading = true
         const requestData = {
          offset: this.offset,
          limit: this.limit,
          // order: this.order,
          // sort: this.sort,
        }
        let res = await getIpList(requestData);
        if(res.code == 0){
          const { data } = res
          this.loading = false
          this.tableData = data.list
          this.total = data.total
        }
        
        // const requestData = {
        //   offset: this.offset,
        //   limit: this.limit,
        //   order: this.order,
        //   sort: this.sort,
        // }
        // axios
        //   .all([
        //     dictMaps({
        //       dictNames: ['getChannelList'],
        //     }),
        //     getServerConfigList(requestData),
        //   ])
        //   .then(
        //     axios.spread((response1, response2) => {
        //       console.log( response1.data.getChannelList)
        //       const { data } = response2
        //       this.loading = false
        //       this.tableData = data.list
        //       this.total = data.total
        //       this.channelList = response1.data.getChannelList
        //       this.formColumns.channel.options = this.channelList
        //     })
        //   )
        //   .catch(() => {
        //     this.loading = false
        //     this.tableData = []
        //     this.total = 0
        //   })
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
        getIpList(requestData)
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
      handleShowDialog(row) {
        this.$refs['dialog'].showDialog(row)
      },
      handleEditPwd(row) {
        this.$refs['editPwd'].showDialog(row)
      },
      handleDelete(row) {
        this.$confirm('确定将IP为' + row.ip + '删除吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            del({ id: row.id }).then((response) => {
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
