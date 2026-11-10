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
  import { create, update } from '@/api/server_config'

  export default {
    name: 'ServerConfigEdit',
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
          id: 0,
          channel: '',
          protocol: '',
          address: '',
          status: '',
          secret: '',
        },
        formColumns: {
          channel: {
            prop: 'channel',
            label: '渠道',
            type: 'select',
            options: this.channelList,
            rules: ['required'],
          },
          protocol: {
            prop: 'protocol',
            label: '协议',
            type: 'text',
            rules: ['required'],
          },
          address: {
            prop: 'address',
            label: '服务地址',
            type: 'text',
            rules: ['required'],
          },
          status: {
            prop: 'status',
            label: '状态',
            type: 'select',
            options: this.statusList,
            rules: ['nullable'],
          },
          secret: {
            prop: 'secret',
            label: '密钥',
            type: 'text',
            rules: ['required'],
          },
        },
      }
    },
    watch: {
      channelList: function (newValue) {
        this.formColumns.channel.options = newValue
      },
      statusList: function (newValue) {
        this.formColumns.status.options = newValue
      },
    },
    methods: {
      showDialog(row,onekey=false) {
        if (row && row.id) {
          // 修改
          if(!onekey){
            this.action = 'edit'
            this.formAttr.title = '编辑'
            this.formData.id = row.id
            deepCopy(this.formData, row)
          }else{
            this.action = 'add'
            this.formAttr.title = '添加'
            deepCopy(this.formData, row)
            this.formData.id =0
          }
         

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
