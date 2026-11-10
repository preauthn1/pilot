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
  import { create, update } from '@/api/pool_settings'

  export default {
    name: 'PoolEdit',
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
          profitLoss: '',
          multiplier: '',
        },
        formColumns: {
          profitLoss: {
            prop: 'profitLoss',
            label: '平台盈亏',
            type: 'text',
            rules: ['required'],
          },
          multiplier: {
            prop: 'multiplier',
            label: '倍数公式乘数',
            type: 'text',
            rules: ['required'],
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
          deepCopy(this.formData, row)
          this.formData.profitLoss = this.formData.profitLoss / 100
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
        data.profitLoss *= 100
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
