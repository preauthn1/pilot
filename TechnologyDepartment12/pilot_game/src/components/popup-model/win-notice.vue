<template>
  <transition name="van-fade" @after-leave="destroyElement">
    <div class="notice-wrapper"  v-show="visible" :style="positionStyle">
      <div class="notice-item">
        <van-icon class="notice-close" class-prefix="icon-fly" name="clear" size="10" @click="close"></van-icon>
        <div class="content">
          <div class="content-col win">
            <div class="label">{{$t('game.win')}}</div>
            <div class="value num-font">{{currency}}{{coin | numberFormat}}</div>
          </div>
          <div class="content-col">
            <div class="label">{{$t('game.win_multiple')}}</div>
            <div class="value num-font">{{multiple | numberFormat}}x</div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  data() {
    return {
      visible: false,
      duration: 2000,
      onClose: null,
      onClick: null,
      closed: false,
      verticalOffset: 0,
      timer: null,
    };
  },

  computed: {
    positionStyle() {
      return {
        'top': `${ this.verticalOffset }px`
      };
    }
  },

  watch: {
    closed(newVal) {
      if (newVal) {
        this.visible = false;
      }
    }
  },

  methods: {
    destroyElement() {
      this.$destroy(true);
      this.$el.parentNode.removeChild(this.$el);
    },

    close() {
      this.closed = true;
      if (typeof this.onClose === 'function') {
        this.onClose();
      }
    },
  },
  mounted() {
    if (this.duration > 0) {
      this.timer = setTimeout(() => {
        if (!this.closed) {
          this.close();
        }
      }, this.duration);
    }
  },
}
</script>

<style lang="less" scoped>
  .notice-wrapper {
    position: fixed;
    left: 50%;
    width: 289px;
    height: 46px;
    -webkit-transform: translateX(-50%);
    transform: translateX(-50%);
    -webkit-transition: opacity 0.3s, top 0.4s, -webkit-transform 0.4s;
    transition: opacity 0.3s, transform 0.4s, top 0.4s, -webkit-transform 0.4s;
  }
  .notice-item {
    height: 100%;
    display: flex;
    align-items: center;
    background-color: #bf8e3a;
    border-radius: 50px;
    opacity: 0.9;
  }
  .notice-close {
    position: absolute;
    top: 18px;
    right: 14px;
    color: #d6b473;
  }

  .content {
    width: 100%;
    display: flex;
    align-items: center;
  }

  .content-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #ffffff;
  }

  .label {
    margin-top: 1px;
  }

  .value {
    font-size: 18px;
    height: 20px;
    line-height: 20px;
    text-shadow: 0px 1px 1px #a17534;
    margin-bottom: 2px;
  }

  .win {
    width: 142px;
    height: 36px;
    background-color: #f69e18;
    border-radius: 50px;
    margin-left: 6px;
    margin-right: 14px;

    .value {
      text-shadow: 0px 1px 1px #a77155;
    }
  }

</style>