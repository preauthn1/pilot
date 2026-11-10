<template>
  <div class="read-only__content">
    <div class="text">
      <slot />
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ReadOnly',
  }
</script>

<style scoped lang="scss">
  .read-only__content {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: #e5e5e5;
    border-radius: 4px;
    .text {
      padding-left: 10px;
    }
  }
</style>
