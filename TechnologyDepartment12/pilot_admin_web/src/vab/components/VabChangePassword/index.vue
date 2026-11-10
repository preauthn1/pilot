<template>
  <el-dialog
    :title="translateTitle('修改密码')"
    :visible.sync="dialogFormVisible"
    append-to-body
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="80px"
      :inline="false"
    >
      <el-form-item label="旧密码" prop="oldPassword" label-width="100px">
        <el-input v-model="form.oldPassword" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword" label-width="100px">
        <el-input v-model="form.newPassword" show-password />
      </el-form-item>
      <el-form-item
        label="确认新密码"
        prop="verifyPassword"
        label-width="100px"
      >
        <el-input v-model="form.verifyPassword" show-password />
      </el-form-item>
      <el-form-item label="谷歌验证码" prop="googleEncrypt" label-width="100px">
        <el-input v-model="form.googleEncrypt" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="save">确 定</el-button>
      <el-button @click="close">取 消</el-button>
    </template>
  </el-dialog>
</template>
<script>
  import { clearObj } from '@/utils'
  import { translateTitle } from '@/utils/i18n'
  import { updatePassword } from '@/api/admin/index'
  export default {
    name: 'VabChangePassword',
    data() {
      return {
        form: {
          oldPassword: '',
          newPassword: '',
          verifyPassword: '',
          googleEncrypt: '',
        },
        rules: {
          oldPassword: [
            { required: true, trigger: 'blue', message: '请输入旧密码' },
          ],
          newPassword: [
            { required: true, trigger: 'blue', message: '请选择新密码' },
          ],
          verifyPassword: [
            { required: true, trigger: 'blue', message: '请输入确认新密码' },
          ],
          googleEncrypt: [
            { required: true, trigger: 'blue', message: '请输入谷歌验证码' },
          ],
        },
        title: '',
        action: '',
        dialogFormVisible: false,
      }
    },
    methods: {
      translateTitle,
      showEdit() {
        clearObj(this.form)
        this.dialogFormVisible = true
      },
      close() {
        this.$refs['form'].resetFields()
        this.form = this.$options.data().form
        this.dialogFormVisible = false
      },
      accept(result) {
        this.$baseMessage(result.message, 'success')
        this.close()
        location.reload()
      },
      save() {
        updatePassword(this.form).then((response) => {
          this.accept(response)
        })
      },
    },
  }
</script>
