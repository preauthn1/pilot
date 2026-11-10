<template>
  <span class="clock-container">{{ currentTime }}</span>
</template>

<script>
  export default {
    name: 'Clock',
    data() {
      return {
        currentTime: '',
        timer: null,
      }
    },
    mounted() {
      this.updateTime()
      this.timer = setInterval(() => {
        this.updateTime()
      }, 1000)
    },
    beforeDestroy() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    methods: {
      updateTime() {
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, '0')
        const d = String(now.getDate()).padStart(2, '0')
        const h = String(now.getHours()).padStart(2, '0')
        const min = String(now.getMinutes()).padStart(2, '0')
        const s = String(now.getSeconds()).padStart(2, '0')
        this.currentTime = `${y}-${m}-${d} ${h}:${min}:${s}`
      },
    },
  }
</script>

<style lang="scss" scoped>
  .clock-container {
    display: flex;
    align-items: center;
    margin: 0 12px;
    font-size: 13px;
    color: $base-color-gray;
    white-space: nowrap;
    user-select: none;
  }
</style>
