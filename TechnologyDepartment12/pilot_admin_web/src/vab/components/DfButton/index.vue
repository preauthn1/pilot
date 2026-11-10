<template>
  <el-button :type="type" round style="margin-bottom: 5px" @click="click">
    <div class="p">
      <div style="margin-bottom: 5px; font-size: 30px">
        {{ data[0] === undefined ? 0 : data[0] }}
      </div>
      <div style="font-size: 15px">
        <slot />
      </div>
      <div style="margin-top: 5px; font-size: 30px">
        {{ data[1] }}
      </div>
    </div>
  </el-button>
</template>

<script>
  export default {
    name: 'Index',
    props: {
      data: {
        type: Array,
        default() {
          return [0, 0]
        },
      },
      type: {
        type: String,
        default: '',
      },
    },
    methods: {
      click(event) {
        this.$emit('click', event)
      },
    },
  }
</script>

<style scoped>
  .p div {
    font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
      'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  }
</style>
