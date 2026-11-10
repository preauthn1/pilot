<template>
  <el-form>
    <el-form-item>
      <el-tree
        ref="tree"
        v-loading="loading"
        :data="data"
        :props="defaultProps"
        node-key="id"
        default-expand-all
        show-checkbox
        check-on-click-node
        style="max-height: 500px; overflow: auto"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">
        {{ $t('common.submit') }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script>
  import { syncPermissions } from '@/api/role'
  import { tree } from '@/api/permission'
  export default {
    name: 'SyncPermissions',
    props: {
      success: {
        type: Function,
        default: null,
      },
      id: {
        type: Number,
        default: 0,
        required: true,
      },
      idList: {
        type: String,
        default: '',
        required: true,
      },
    },
    data() {
      return {
        loading: true,
        data: [],
        defaultProps: {
          children: 'children',
          label: 'title',
        },
        permissionIdList: [],
      }
    },
    watch: {
      id() {
        // 清空选中节点
        this.$refs.tree.setCheckedKeys([])
      },
      idList() {
        this.initDefaultChecked()
      },
    },
    mounted() {
      this.getTree()
    },
    methods: {
      getTree() {
        this.data = []
        tree({
          guard_name: 'admin',
        })
          .then((response) => {
            this.loading = false
            this.data = response.data.tree
            this.initDefaultChecked()
          })
          .catch((reason) => {
            this.loading = false
          })
      },
      // 设置默认选中
      initDefaultChecked() {
        const _this = this
        _this.permissionIdList = _this.idList.split(',')
        this.$nextTick(() => {
          _this.permissionIdList.map((i) => {
            const node = _this.$refs.tree.getNode(i)
            if (node.isLeaf) {
              _this.$refs.tree.setChecked(node, true)
            }
          })
        })
      },
      onSubmit() {
        const data = this.$refs.tree
          .getCheckedKeys()
          .concat(this.$refs.tree.getHalfCheckedKeys())
        syncPermissions({
          id: this.id,
          permissions: data,
        }).then((response) => {
          this.$message({
            message: response.message,
            type: 'success',
          })
          this.success()
        })
      },
    },
  }
</script>

<style scoped></style>
