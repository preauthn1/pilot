<template>
  <el-dialog
    :title="translateTitle('切换线路')"
    :visible.sync="dialogFormVisible"
    append-to-body
    width="500px"
    :close-on-click-modal="false"
  >
    <el-radio-group v-model="line">
      <el-radio
        v-for="(item, index) in lineList"
        :key="index"
        :label="item"
        @change="handleLingChange"
      >
        线路{{ index + 1 }}
      </el-radio>
    </el-radio-group>
  </el-dialog>
</template>

<script>
  import { translateTitle } from '@/utils/i18n'
  export default {
    name: 'VabChangeLineUrl',
    data() {
      return {
        line: localStorage.getItem('lineUrl'),
        lineList: [],
        dialogFormVisible: false,
      }
    },
    methods: {
      translateTitle,
      showLine() {
        this.lineList = process.env.VUE_APP_BASE_API.split(',')
        this.dialogFormVisible = true
      },
      handleLingChange(value) {
        localStorage.setItem('lineUrl', value)
        location.reload()
      },
    },
  }
</script>

<style scoped></style>
