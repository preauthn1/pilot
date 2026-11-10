<template>
  <div class="history-box">
    <div class="history-content">
      <transition-group name="history-list" tag="div" class="history-wrapper">
        <span v-for="item in historyList" :key="item.id" :style="{background: handleColor(item.value)}"  class="van-tag history-item">
          {{item.value | numberFormat}}x
        </span>
      </transition-group>
      <!-- <div class="shadow"></div> -->
      <!-- <div class="dropdown-btn">
        <van-button :class="{ down: show}" @click="show = !show">
          <van-icon class-prefix="icon-fly" name="history" size="11"></van-icon>
        </van-button>
      </div> -->
    </div>
    <van-popup v-model="show" :overlay="false" class="popup-wrapper">
      <div class="popup-header">
        <span>{{$t('game.history')}}</span>
      </div>
      <div class="popup-history-list">
        <van-tag v-for="(item, index) in historyList" :key="index"   :color="handleColor(item.value)">{{item.value | numberFormat}}x</van-tag>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: "HistoryBox",
  computed: {
    ...mapGetters({
      historyList: 'record/historyList',
    }),
  },
  props:{
    show:{
      type:Boolean,
      default:false
    }
  },
  data() {
    return {
      // show: false,
    }
  },
  methods: {
    handleColor(value) {
      return value < 200 ? '#3df2ff' : value < 500 ? '#3df2ff' : value < 1000 ? '#FDAD14' : 'red';
    }
  },
}
</script>