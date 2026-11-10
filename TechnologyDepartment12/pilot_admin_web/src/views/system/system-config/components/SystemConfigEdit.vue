<template>
  <el-dialog
    v-el-drag-dialog
    :title="title"
    :visible.sync="dialogFormVisible"
    :close-on-click-modal="false"
  >
    <el-form ref="form" :model="form" label-width="auto">
      <el-form-item :label="$t('systemConfig.key')" prop="key" :error="errors.key ? errors.key[0] : ''">
        <el-input v-model="form.key" />
      </el-form-item>
      <el-form-item :label="$t('systemConfig.value')" prop="value" :error="errors.value ? errors.value[0] : ''">
        <el-input v-model="form.value" />
      </el-form-item>
      <el-form-item :label="$t('systemConfig.remark')" prop="remark" :error="errors.remark ? errors.remark[0] : ''">
        <el-input v-model="form.remark" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="Loadings" @click="onSave('form')">{{ $t('common.confirmButtonText') }}</el-button>
        <el-button @click="close">{{ $t('common.cancelButtonText') }}</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script>
import { clearObj, deepCopy } from '@/utils'
import { create, update } from '@/api/system-config/system-config'

export default {
  name: 'SystemConfigEdit',
  data() {
    return {
      title: '',
      action: '',
      dialogFormVisible: false,
      errors: {},
      Loadings: false,
      form: {
        key: '',
        value: '',
        remark: ''
      }
    }
  },
  methods: {
    showEdit(row) {
      if (row.id) {
        this.title = '修改'
        this.action = 'edit'
        this.form.id = row.id
        deepCopy(this.form, row)
      } else {
        this.title = '添加'
        this.action = 'add'
        clearObj(this.form)
      }
      this.dialogFormVisible = true
    },
    close() {
      this.$refs['form'].resetFields()
      this.form = this.$options.data().form
      this.dialogFormVisible = false
    },
    onSave(formData) {
      if (this.action === 'add') {
        this.onCreate(formData)
      } else {
        this.onUpdate(formData)
      }
    },
    onCreate() {
      this.errors = {}
      this.Loadings = true
      create(this.form).then(response => {
        this.$message({
          message: response.message,
          type: 'success'
        })
        this.offset = 0
        this.$emit('fetch-data')
        this.close()
      }).catch(reason => {
        const { data } = reason.response
        if (data.code === 422) {
          this.errors = data.data
        }
      }).finally(() => {
        this.Loadings = false
      })
    },
    onUpdate() {
      this.errors = {}
      this.Loadings = true
      update(this.form).then(response => {
        this.$message({
          message: response.message,
          type: 'success'
        })
        this.$emit('fetch-data')
        this.close()
      }).catch(reason => {
        const { data } = reason.response
        if (data.code === 422) {
          this.errors = data.data
        }
      }).finally(() => {
        this.Loadings = false
      })
    }
  }
}
</script>

<style scoped>

</style>
