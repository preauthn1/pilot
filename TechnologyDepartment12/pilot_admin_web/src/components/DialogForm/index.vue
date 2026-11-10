<template>
  <el-dialog
    v-el-drag-dialog
    :width="widths"
    :title="formAttr.title"
    :visible.sync="dialogVisible"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <base-form
      ref="baseForm"
      style="max-height: 500px; overflow: auto"
      :form-attr="formAttr"
      :form-data.sync="data"
      :form-columns="columns"
      :submit-loading="loading"
      @handle-submit="handleSave"
      @handle-close="handleClose"
    >
      <slot slot="button" name="formButton" />
      <slot slot="item" name="formItem" />
    </base-form>
    <slot name="dialog" />
  </el-dialog>
</template>
<script>
  import BaseForm from '@/components/BaseForm'

  export default {
    name: 'DialogForm',
    components: { BaseForm },
    props: {
      loading: {
        type: Boolean,
        default: false,
      },
      formAttr: {
        type: Object,
        default: () => {
          return {}
        },
      },
      formData: {
        type: Object,
        default: () => {
          return {}
        },
      },
      formColumns: {
        type: Object,
        default: () => {
          return {}
        },
      },
      widths: {
        type: String,
        default: () => {
          return '1000px'
        },
      },
    },
    data() {
      return {
        dialogVisible: false,
        data: {},
        columns: {},
      }
    },
    watch: {
      formColumns: {
        deep: true,
        handler(val, oldVal) {
          this.columns = this.$util.deepClone(val)
          this.handleData()
        },
      },
    },
    methods: {
      resetForm() {
        this.$refs['baseForm'].resetForm()
      },
      clearValidate() {
        this.$refs['baseForm'].clearValidate()
      },
      handleData() {
        // 对初始数据进行处理
        for (const i in this.formColumns) {
          const { callback } = this.formColumns[i]
          if (this.formData[i] && typeof callback === 'function') {
            this.data[i] = callback(this.formData[i])
            this.columns[i].callback = null
          }
        }
        if (this.$refs['baseForm']) {
          this.$nextTick(() => {
            this.clearValidate()
          })
        }
      },
      showDialog() {
        this.data = this.$util.deepClone(this.formData)
        this.columns = this.$util.deepClone(this.formColumns)
        this.handleData()
        this.dialogVisible = true
      },
      handleClose() {
        this.dialogVisible = false
      },
      handleSave() {
        this.$emit('handle-submit', { ...this.data })
      },
      setValue(prop, value) {
        this.$refs['baseForm'].setValue(prop, value)
      },
    },
  }
</script>
