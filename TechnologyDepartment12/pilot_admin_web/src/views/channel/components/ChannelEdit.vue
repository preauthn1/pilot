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
  import { create, update } from '@/api/channel'

  export default {
    name: 'ChannelEdit',
    components: { DialogForm },
    props: {
      merchantList: {
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
          merchantId: '',
          name: '',
          playerPrefix: '',
          amount: '',
          notifyUrl: '',
          offlineUrl: '',
          domain: '',
          tag: '',
          gameCode: '',
        },
        formColumns: {
          merchantId: {
            prop: 'merchantId',
            label: '商户名称',
            type: 'select',
            options: this.merchantList,
            rules: ['required'],
          },
          name: {
            prop: 'name',
            label: '渠道名称',
            type: 'text',
            rules: ['required'],
          },
          playerPrefix: {
            prop: 'playerPrefix',
            label: '前缀',
            type: 'text',
            rules: ['required'],
          },
          amount: {
            prop: 'amount',
            label: '渠道余额',
            type: 'text',
            rules: ['required'],
          },
          notifyUrl: {
            prop: 'notifyUrl',
            label: '回调地址',
            type: 'text',
          },
          offlineUrl: {
            prop: 'offlineUrl',
            label: '离线通知回调地址',
            type: 'text',
          },
          domain: {
            prop: 'domain',
            label: '游戏地址',
            type: 'text',
          },
          tag: {
            prop: 'tag',
            label: '游戏标识',
            type: 'text',
          },
          gameCode: {
            prop: 'gameCode',
            label: '游戏代码',
            type: 'text',
          },
        },
      }
    },
    watch: {
      merchantList: function (newValue) {
        this.formColumns.merchantId.options = newValue
      },
    },
    methods: {
      showDialog(row,onekey=false) {
        if (row && row.id) {
          if(!onekey){
            this.action = 'edit'
            this.formAttr.title = '编辑'
            this.formData.id = row.id
            this.formColumns.name.disabled = true
             // 修改
             deepCopy(this.formData, row)
          }else{
            this.action = 'add'
            this.formColumns.name.disabled = false
            this.formAttr.title = '添加'
            deepCopy(this.formData, row)
            this.formData.id = 0
          }
          this.formData.amount = row.amount / 100
        } else {
          // 创建
          this.action = 'add'
          this.formAttr.title = '添加'
          clearObj(this.formData, true)
          this.formData.merchantId = ''
          this.formData.amount = 0
          this.formColumns.name.disabled = false
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
        data.amount = data.amount * 100
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
