<template>
    <dialog-form
      ref="dialogFrom"
      :loading="loading"
      :form-attr="formAttr"
      :form-data="formData"
      :form-columns="formColumns"
      @handle-submit="onSave"
    />
  </template>
  
  <script>
    import DialogForm from '@/components/DialogForm'
    import { clearObj, deepCopy, uuid } from '@/utils'
    // import { create, update } from '@/api/server_config'
    import { create,update } from '@/api/whitelist'
    export default {
      name: 'WhiteEdit',
      components: { DialogForm },
      props: {
        statusList: {
          type: Object,
          required: true,
          default: () => {
            return {}
          },
        },
        channelList: {
          type: Object,
          required: true,
          default: () => {
            return {}
          },
        },
      },
      data() {
        return {
          action: '',
          loading: false,
          platformId: '',
          packageInfo: [],
          formAttr: {
            title: this.$t('common.update'),
            isInline: false,
            submitButtonText: this.$t('common.confirmButtonText'),
            showReset: false,
            showCancel: true,
            labelWidth: '180px',
          },
          formData: {
            id:0,
            ip: '',
            admin_status:0,
            api_status:0,
            remarks:''
          },
          formColumns: {
            ip: {
              prop: 'ip',
              label: 'ip地址',
              type: 'text',
              rules: ['required'],
            },
            admin_status: {
              prop: 'admin_status',
              label: '后台状态',
              type: 'radio',
              options:['黑名单','白名单',],
              rules: [],
            },
            api_status: {
              prop: 'api_status',
              label: '接口状态',
              type: 'radio',
              options:['黑名单','白名单'],
              rules: [],
            },
            remarks: {
              prop: 'remarks',
              label: '备注',
              type: 'textarea',
              rules: [],
            },
          },
        }
      },
      watch: {
        channelList: function (newValue) {
        //   this.formColumns.channel.options = newValue
        },
        statusList: function (newValue) {
          this.formColumns.status.options = newValue
        },
      },
      methods: {
       
        showDialog(row) {
          console.log(row);
          if (row && row.id) {
            // 修改
            this.action = 'edit'
            this.formAttr.title = '编辑'
            this.formData.id = row.id
            this.formData.admin_status = row.adminStatus
            this.formData.api_status = row.apiStatus
            deepCopy(this.formData, row)
            console.log(this.formData);
          } else {
            // 创建
            this.action = 'add'
            this.formAttr.title = '添加'
            clearObj(this.formData, true)
            this.formData.id = 0
            this.$nextTick(() => {
              this.$refs['dialogFrom'].clearValidate()
            })
          }
          this.$refs['dialogFrom'].showDialog()
        },
        onSave(data) {
          this.loading = true
          let func = null
          let isHomePage = false
          // let {admin_status,api_status,ip,remarks} = data;
          if (this.action === 'add') {
            func = create
            isHomePage = true
          } else {
            func = update
          }
          func({ ...data })
            .then((response) => {
              this.$message({
                message: response.message,
                type: 'success',
              })
              this.$emit('fetch-data', isHomePage)
              this.$refs['dialogFrom'].handleClose()
            })
            .finally(() => {
              this.loading = false
            })
         },
      },
    }
  </script>
  