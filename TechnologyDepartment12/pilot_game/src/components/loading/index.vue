<template>
  <div class="loading-box">
    <div>POWERD BY</div>
    <div>
      <img src="@/assets/image/loading-logo.png" alt="loading-logo" class="loading-logo">
    </div>
    <template v-if="errorMessage">
      <div class="loading-error">{{ errorMessage }}</div>
      <button class="retry-button" type="button" @click="$emit('retry')">Retry</button>
    </template>
    <div v-else class="loading-circle">
      <div v-for="item, index in circleList" :key="index" :class="[item, 'circle']"></div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    errorMessage: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      circleList: ['circle-1', 'circle-2', 'circle-3'],
      timer: null,
    };
  },
  mounted() {
    this.timer = setInterval(() => {
      this.circleList = this.circleList.map(item => {
        return item === 'circle-1' ? 'circle-2' : item === 'circle-2' ? 'circle-3' : 'circle-1';
      });
    }, 800);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
};
</script>

<style scoped>
.loading-box {
  width: 100%;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: #0B0C27;
  color: #4a4a4a;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 15px;
}

.loading-logo {
  width: 130px;
  height: 45px;
  object-fit: contain;
  margin: 4px 0 14px;
}

.loading-circle {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  position: relative;
}

.loading-error {
  color: #ffffff;
  margin-bottom: 14px;
}

.retry-button {
  min-width: 96px;
  height: 34px;
  border: 1px solid #f01d14;
  border-radius: 17px;
  background: transparent;
  color: #ffffff;
  font-size: 14px;
}

.circle {
  width: 4px;
  height: 4px;
  background-color: #f01d14;
  border-radius: 50%;
  position: absolute;
  transition: transform 0.5s linear;
}

.circle-1 {
  transform: translateX(-14px);
}

.circle-2 {
  transform: translateX(0px) scale(2.5);
}

.circle-3 {
  transform: translateX(14px);
}
</style>