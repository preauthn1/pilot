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
  import { create, update } from '@/api/merchant'

  export default {
    name: 'MerchantEdit',
    components: { DialogForm },
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
          username: '',
          returnUrl: '',
          gameCode: '',
          walletType: '',
        },
        formColumns: {
          username: {
            prop: 'username',
            label: '商户名称',
            type: 'text',
            rules: ['required'],
          },
          password: {
            prop: 'password',
            label: '商户密码',
            type: 'text',
            rules: ['required'],
          },
          returnUrl: {
            prop: 'returnUrl',
            label: '回调地址',
            type: 'text',
          },
          gameCode: {
            prop: 'gameCode',
            label: '游戏代码',
            type: 'text',
          },
          walletType: {
            prop: 'walletType',
            label: '钱包类型',
            type: 'text',
          },
        },
      }
    },
    watch: {},
    methods: {
      showDialog(row) {
        if (row && row.id) {
          // 修改
          this.action = 'edit'
          this.formAttr.title = '编辑'
          this.formData.id = row.id
          this.formColumns.password.hidden = true
          this.formColumns.password.rules = ['nullable']
          deepCopy(this.formData, row)
        } else {
          // 创建
          this.action = 'add'
          this.formAttr.title = '添加'
          clearObj(this.formData, true)
          this.formData.id = 0
          this.formColumns.password.hidden = false
          this.formColumns.password.rules = ['required']
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
