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
  import { create, update } from '@/api/task'
  export default {
    name: 'TaskEdit',
    components: { DialogForm },
    props: {
      systemList: {
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
        loading: false,
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
          title:'',
          state:0,
          content:'',
          money:0,
          requirement:'',
          num:0,
          remarks:'',
          channel:'',
          system:''
        },
        formColumns: {
          channel: {
            prop: 'channel',
            label: '渠道',
            type: 'select',
            options: this.channelList,
            rules: ['required'],
          },
          system: {
            prop: 'system',
            label: '系统配置',
            type: 'select',
            options: this.systemList,
            rules: ['required'],
          },
          title: {
            prop: 'title',
            label: '标题',
            type: 'text',
          },
          state: {
            prop: 'state',
            label: '状态',
            type: 'switch',
          },
          num: {
            prop: 'num',
            label: '数量',
            type: 'text',
          },
          money: {
            prop: 'money',
            label: '金额',
            type: 'text',
            placeholder: '请严格按照格式输入例如 {"AF":2,"USDT":1}',
          },
          content: {
            prop: 'content',
            label: '内容',
            type: 'editor',
          },
          requirement: {
            prop: 'requirement',
            label: '要求',
            type: 'textarea',
          },
          remarks: {
            prop: 'remarks',
            label: '备注',
            type: 'textarea',
          },

          material: {
            prop: 'material',
            label: '物料',
            type: 'upload',
          },
        },
      }
    },
    watch: {
      channelList: function (newValue) {
        this.formColumns.channel.options = newValue
      },
      systemList: function (newValue) {
        this.formColumns.system.options = newValue
      },
    },
    methods: {
      showDialog(row) {
        if (row && row.id) {
          // 修改
          this.action = 'edit'
          this.formAttr.title = '编辑'
          deepCopy(this.formData, row)
        }else{
          this.formAttr.title = '创建'
          this.formData.title= ''
          this.formData.channel= ''
          this.formData.system= ''
          this.formData.state= ''
          this.formData.content= ''
          this.formData.requirement= ''
          this.formData.num= ''
          this.formData.money = ''
          this.formData.remarks= ''
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
