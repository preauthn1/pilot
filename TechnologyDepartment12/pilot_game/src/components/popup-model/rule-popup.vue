<template>
  <div class="popup-wrapper">
    
    <div class="rule-header">{{$t('game.game_rule')}}
      <van-icon class="close" class-prefix="icon-fly" name="clear" size="20" @click="handleClose"></van-icon>
    </div>
    <div class="rule-body" v-html="ruleContent"></div>
  </div>
</template>

<script>
export default {
  name: "rulePopup",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ruleContent() {
      return this.$store.getters.ruleContent || this.$t('rule')
    },
  },
  methods: {
    handleClose() {
      this.$emit('input', false)
      document.body.style.overflow = 'auto' // 弹层不显示时
      document.body.style.position = null
    }
  }
}
</script>

<style lang="css" scoped>
  .popup-wrapper {
    position: fixed;
    top: 0px;
    left:0;right: 0;bottom: 0;
    background-color: #10192e;
     /* background-image: url(../../assets/image/background3.png); */
    background-repeat: no-repeat;
    background-size:100% 100%;
    border-radius: 14px;
    margin: 0 4px;
    margin-top:30px;
    margin-bottom: 5px;
    z-index: 30;
    overflow: hidden;
  }
  .rule-header {
    width: 100%;
    height: 52px;
    line-height: 52px;
    /* background-color: #1e323e; */
    font-size: 20px;
    color: #e8a025;
    text-align: center;
    border-radius: 14px 14px 0px 0px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close {
    position: absolute;
    top: 0px;
    right: 12px;
    color: #656565;
  }

  .rule-body {
    max-height: 556px;
    overflow-y: auto;
    font-size: 13px;
    color: #a8a8a8;
    padding: 0 14px;
  }

  ::v-deep h1 {
    font-size: 17px;
    color: #a87825;
  }

  ::v-deep h2 {
    font-size: 15px;
    font-weight: normal;
  }
 ::v-deep p {
    margin-block: 4px;
  }

</style>
