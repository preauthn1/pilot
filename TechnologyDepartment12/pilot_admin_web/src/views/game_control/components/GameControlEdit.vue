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
  import { create, update } from '@/api/game_control'

  export default {
    name: 'GameControlEdit',
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
          system: '',
          reserve: '',
          rebate: '',
          gameMax: '',
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
          reserve: {
            prop: 'reserve',
            label: '金额',
            type: 'number',
            rules: ['required'],
          },
          rebate: {
            prop: 'rebate',
            label: '公式乘数',
            type: 'number',
            rules: ['required'],
          },
          gameMax: {
            prop: 'gameMax',
            label: '单局最高限额',
            type: 'number',
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
      showDialog(row,onkey) {
        if (row && row.id) {
          // 修改
          if(onkey){
            // this.action = 'edit'
            this.formAttr.title = '创建'
            deepCopy(this.formData, row)
            this.formData.id = 0
          }else{
            this.action = 'edit'
            this.formAttr.title = '编辑'
            this.formData.id = row.id
            deepCopy(this.formData, row)
          }
          this.formData.reserve = this.formData.reserve / 100
          this.formData.gameMax = (this.formData.gameMax || 0) / 100
        }else{
          this.formAttr.title = '创建'
          this.formData.reserve= 0
          this.formData.rebate= 0
          this.formData.system= ''
          this.formData.channel= ''
        }
        this.$refs['dialogFrom'].showDialog()
      },
      onSave(data) {
        this.loading = true
        let isHomePage = false
        if (data.rebate > 9 || data.rebate < 0) {
          this.$message.error('公式乘数不能大于9或者小于0')
          this.loading = false
          return
        }
        data.reserve *= 100
        if (data.gameMax) data.gameMax *= 100
        let func = (this.action === 'add') ? create : update
        if (this.action === 'add') isHomePage = true
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
