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
  import { create, update } from '@/api/admin'
  import { getChannelBy } from '@/api/channel'

  export default {
    name: 'AdminEdit',
    components: { DialogForm },
    props: {
      roleList: {
        type: Object,
        required: true,
        default: () => {
          return {}
        },
      },
      merchantList: {
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
      adminTypeList: {
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
          adminType: '',
          merchantId: [],
          channelId: '',
          roleId: '',
          name: '',
          password: '',
          optPwd: '',
          status: 1,
        },
        formColumns: {
          adminType: {
            prop: 'adminType',
            label: '管理员类型',
            type: 'select',
            options: this.adminTypeList,
            rules: ['required'],
            change: this.adminTypeChange,
          },
          merchantId: {
            prop: 'merchantId',
            label: '商户',
            type: 'select',
            multiple:true,
            options: this.merchantList,
            rules: ['required'],
            hidden: true,
            change: this.merchantChange,
          },
          channelId: {
            prop: 'channelId',
            label: '渠道',
            type: 'select',
            options: this.channelList,
            rules: ['nullable'],
            hidden: true,
          },
          roleId: {
            prop: 'roleId',
            label: this.$t('admin.roles'),
            type: 'select',
            options: this.roleList,
            rules: ['required'],
          },
          name: {
            prop: 'name',
            label: this.$t('admin.name'),
            type: 'text',
            rules: ['required'],
          },
          password: {
            prop: 'password',
            label: this.$t('admin.password'),
            type: 'text',
            rules: ['required'],
          },
          optPwd: {
            prop: 'optPwd',
            label: this.$t('admin.optPwd'),
            type: 'text',
            rules: ['required'],
          },
          status: {
            prop: 'status',
            label: this.$t('admin.status'),
            type: 'switch',
          },
        },
      }
    },
    watch: {
      roleList: function (newValue) {
        this.formColumns.roleId.options = newValue
      },
      merchantList: function (newValue) {
         this.formColumns.merchantId.options = newValue
      },
      channelList: function (newValue) {
        this.formColumns.channelId.options = newValue
      },
      adminTypeList: function (newValue) {
        this.formColumns.adminType.options = newValue
      },
    },
    methods: {
      showDialog(row) {
        if (row && row.id) {
          // 修改
          this.action = 'edit'
          if (row.adminType == 0) {
            this.formColumns.merchantId.hidden = false
          } else if (row.adminType == 1) {
            this.formColumns.merchantId.hidden = false
            this.formColumns.channelId.hidden = false
          }
          this.formColumns.adminType.disabled = true
          this.formColumns.merchantId.disabled = false
          this.formColumns.channelId.disabled = true
         
          this.formColumns.password.rules = []
          this.formColumns.password.placeholder = '不填则不修改'
          this.formColumns.optPwd.rules = []
          this.formColumns.optPwd.placeholder = '不填则不修改'
          this.formAttr.title = this.$t('common.update')
          this.formData.id = row.id
          this.formColumns.merchantId.rules = ['required']
          deepCopy(this.formData, row)
          this.formData.password = ''
          this.formData.optPwd = ''
          this.formData.merchantId = row.merchantId.map(cell=>cell*1)
          if (row.name == 'admin') {
            this.formColumns.merchantId.rules = []
          }
        } else {
          // 创建
          this.action = 'add'
          this.formAttr.title = this.$t('common.create')
          clearObj(this.formData, true)
          this.formData.id = 0
          this.formData.roleId = ''
          this.formData.adminType = ''
          this.formData.merchantId = []
          this.formData.channelId = ''
          this.formColumns.merchantId.hidden = true
          this.formColumns.channelId.hidden = true
          this.formColumns.adminType.disabled = false
          this.formColumns.merchantId.disabled = false
          this.formColumns.channelId.disabled = false
          this.formData.password = uuid(6)
          this.formData.optPwd = uuid(6)
          this.formColumns.merchantId.rules = ['required']
          this.$nextTick(() => {
            this.$refs['dialogFrom'].clearValidate()
          })
        }
        this.$refs['dialogFrom'].showDialog()
      },
      adminTypeChange(value) {
        if (value == 0) {
          this.formColumns.merchantId.hidden = false
        } else {
          this.formColumns.merchantId.hidden = false
          this.formColumns.channelId.hidden = false
        }
      },
      merchantChange(value) {
        value = value.join(',')
        getChannelBy({ merchantId: value }).then((response) => {
          this.formColumns.channelId.options = response.data
        })
      },
      onSave(data) {
        this.loading = true
        let func = null
        let isHomePage = false
        if (this.action === 'add') {
          func = create
          isHomePage = true
        } else {
          data.password === '' && delete data.password
          data.optPwd === '' && delete data.optPwd
          func = update
        }
        if (data.channelId == '') {
          data.channelId = 0
        }
        if (data.merchantId.length == 0) {
          data.merchantId = [0]
        }
        data.merchantId = data.merchantId.join(',')
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
