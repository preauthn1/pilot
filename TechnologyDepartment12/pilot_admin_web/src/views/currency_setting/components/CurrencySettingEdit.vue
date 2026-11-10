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
  import { create, update } from '@/api/currency_setting'

  export default {
    name: 'CurrencySettingEdit',
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
          currency: '',
          tag: '',
        },
        formColumns: {
          currency: {
            prop: 'currency',
            label: '币种',
            type: 'text',
            rules: ['required'],
          },
          tag: {
            prop: 'tag',
            label: '符号',
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
          deepCopy(this.formData, row)
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
