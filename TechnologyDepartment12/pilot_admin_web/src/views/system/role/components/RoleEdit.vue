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
  import { clearObj, deepCopy } from '@/utils'
  import { create, update } from '@/api/role'

  export default {
    name: 'RoleEdit',
    components: { DialogForm },
    data() {
      return {
        action: '',
        loading: false,
        formAttr: {
          title: '',
          isInline: false,
          submitButtonText: this.$t('common.confirmButtonText'),
          showReset: false,
          showCancel: true,
          labelWidth: '100px',
        },
        formData: {
          id: 0,
          name: '',
        },
        formColumns: {
          name: {
            prop: 'name',
            label: this.$t('admin.name'),
            type: 'text',
            rules: ['required'],
          },
        },
      }
    },
    methods: {
      showDialog(row) {
        if (row && row.id) {
          // 修改
          this.action = 'edit'
          this.formAttr.title = this.$t('common.update')
          this.formData.id = row.id
          deepCopy(this.formData, row)
        } else {
          // 创建
          this.action = 'add'
          this.formAttr.title = this.$t('common.create')
          clearObj(this.formData)
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
        func({ ...data, guardName: 'admin' })
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
