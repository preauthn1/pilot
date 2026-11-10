<template>
  <div class="page">
    <!-- <div class="poster" v-if="poster">
        <div>
          <div class="title">Rocket Flight</div>
        <div class="info"> {{ info }} </div>
        <div  class="btn" :class="active?'btn_active':''">
            <img src="@/assets/image/poster-btn.png"  alt="" @click="handleStart">
        </div>
        </div>
    </div> -->

    <Loading v-if="overlay & !pageLoad" :error-message="connectionError" @retry="retryConnection"/>
    <div class="container" v-show="!overlay & pageLoad">
      <div class="header-top">
        <!-- <div class="lt" @click="handleBack"><van-icon name="arrow-left" color="#fff" size="20" style="margin-left:10px;"/></div> -->
        <van-image class="rt" :src="require('@/assets/image/logo.png')" height="22" style="margin-left:20px;" />
        <!-- <div class="rt" @click="handleLangClick">
            <van-image :src="selectLang.url" width="20" height="15"></van-image>
            <div class="top-ang-txt">{{ selectLang.name }}</div>
            <van-image :src="require('@/assets/image/btm-icon.png')" width="13" height="7" ></van-image>
         </div> -->
      </div>
      <van-sticky class="header-sticky">
        <div class="container-header">
          <!-- <van-image class="container-header__logo" :src="require('@/assets/image/logo.png')" width="120" height="29" /> -->
          <!-- <div class="container-header__logo"></div> -->
          <!-- <div class="container-header__menu">
            <van-tag class="amount num-font" size="large" round>
              {{currency}}{{ coin | numberFormat }}
            </van-tag>
            <van-image class="menu-btn" :src="require('@/assets/image/help.png')" @click="showRule = true" />
          </div> -->
          <div class="lt">
            <div class="lt-text">{{ currency }}{{ coin | numberFormat }}</div>
          </div>
          <!-- <div class="mid" @click="i18nShow = !i18nShow">{{ $t('game.change_lang') }}</div>  -->
          <div class="rt">
            <div class="rt-box" @click="historyShow = !historyShow, showRule = false">
              <van-image :src="require('@/assets/image/shijian.png')" width="15" height="15"></van-image>
              <van-image class="rt-box-img" :class="historyShow ? 'rt-box-img1' : 'rt-box-img2'"
                :src="require('@/assets/image/xiala.png')" width="14" height="10"></van-image>
            </div>
            <van-image class="rt-img" :src="require('@/assets/image/copy.png')" @click="hanldeRule" width="19"
              height="21"></van-image>
          </div>
        </div>
      </van-sticky>
      <div class="container-content">
        <template v-if="!overlay & pageLoad">
          <div class="container-content-left">
            <history-box :show="historyShow"></history-box>
            <game-box></game-box>
            <div class="container-content-left-bet-box">
              <bet-box v-model="betBoxCount" :id="1"></bet-box>
              <bet-box v-show="betBoxCount === 2" v-model="betBoxCount" :id="2"></bet-box>
            </div>
          </div>
          <list-box></list-box>
        </template>
      </div>
      <van-overlay :z-index="21" :show="showRule"></van-overlay>
      <rule-popup v-show="showRule" v-model="showRule"></rule-popup>
    </div>

    <!---切换语言-->
    <van-popup v-model="i18nShow" :round="true">

      <div>
        <div class="i18n-top">{{ $t('game.change_lang') }}
          <div class="i18n-close">
            <van-image @click="handleLangClick" :src="require('@/assets/image/i18n-close.png')" width="15"
              height="15"></van-image>
          </div>
        </div>
        <div class="i18n-box">

          <div class="i18n-box-item" v-for="item, index in i18nArr" :key="index"
            :class="i8nActive == index ? 'i8nActive' : ''" @click="handleLang(item, index)">
            <div>
              <div class="i18n-img-box">
                <van-image class="i18n-img" :src="item.url"></van-image>
              </div>
              <div class="i18n-txt">{{ item.name }}</div>
            </div>
          </div>

        </div>
        <div class="i18n-btm-submit" @click="handleLangSubmit">{{ $t('game.confirm') }}</div>
      </div>
    </van-popup>
  </div>

</template>

<script>
import HistoryBox from '../components/history-box'
import BetBox from '../components/bet-box'
import ListBox from '../components/list-box'
import GameBox from '../components/game-box'
import Mixin from "./mixin";
import { mapGetters } from "vuex";
import RulePopup from "./popup-model/rule-popup";

import tw from "@/assets/image/local/en-TW.png"
import en from "@/assets/image/local/en-EN.png"
import idn from "@/assets/image/local/en-IDN.png"
import th from "@/assets/image/local/en-TH.png"
import ph from "@/assets/image/local/en-PH.png"
import vn from "@/assets/image/local/en-VN.png"
import my from "@/assets/image/local/en-MY.png"
import Loading from './loading/index.vue'
export default {
  name: 'Fly',
  components: { RulePopup, BetBox, ListBox, HistoryBox, GameBox, Loading },//
  mixins: [Mixin],
  computed: {
    ...mapGetters({
      coin: 'user/coin',
      currency: 'settings/currency',
      pageLoad: 'client/pageLoad',
      progress: 'game/progress'
    })
  },
  watch: {
    connected: {
      handler(current, origin) {
        if (!current && origin) {
          this.$dialog.alert({
            message: this.$t('tips.connect_lost'),
            confirmButtonText: this.$t('btn.confirm'),
            theme: 'round-button',
          }).then(() => {
            window.parent.location.reload();
          })
        } else if (current && !origin) {
          this.overlay = false
        }
      }
    }
  },
  data() {
    return {
      betBoxCount: 2,
      bet: {},
      showRule: false,
      active: false,
      poster: localStorage.getItem('username') ? false : true,
      info: '《 Rocket Flight 》',
      historyShow: false,
      i18nShow: false,
      i18nArr: [
        {
          url: tw,
          name: 'TW',

        },
        {
          url: en,
          name: 'EN'
        }, {
          url: idn,
          name: 'IDN'
        }, {
          url: ph,
          name: 'PH'
        }, {
          url: th,
          name: 'TH'
        }, {
          url: vn,
          name: 'VN'
        }, {
          url: my,
          name: 'MY'
        }
      ],
      selectLang: {
        url: en,
        name: 'EN'
      },
      selectLang2: {
        url: en,
        name: "EN"
      },
      i8nActive: -1
    }
  },
  mounted() {
    let name = localStorage.getItem('lang2') || "EN";
    switch (name) {
      case 'EN':
        this.selectLang.url = en;
        this.selectLang.name = name;
        break;
      case 'TW':
        this.selectLang.url = tw;
        this.selectLang.name = name;
        break;
      case 'TH':
        this.selectLang.url = th;
        this.selectLang.name = name;
        break;
      case 'VN':
        this.selectLang.url = vn;
        this.selectLang.name = name;
        break;
      case 'PH':
        this.selectLang.url = ph;
        this.selectLang.name = name;
        break;
      case 'IDN':
        this.selectLang.url = idn;
        this.selectLang.name = name;
        break;
      case 'MY':
        this.selectLang.url = my;
        this.selectLang.name = name;
        break;
      default:

    }
  },
  methods: {
    hanldeRule() {
      this.historyShow = false
      this.showRule = true
      document.body.style.overflow = 'hidden'  // 弹层显示时
      document.body.style.position = 'relative'
    },
    handleBack() {
      window.history.back();
    },
    handleLangClick() {
      this.i18nShow = !this.i18nShow;
      this.i8nActive = -1;
    },
    handleLangSubmit() {
      if (this.i8nActive == -1) {
        return;
      }
      try {
        localStorage.setItem('lang', "en-" + this.selectLang2.name)
        localStorage.setItem('lang2', this.selectLang2.name)
      } catch (error) {
        localStorage.setItem('lang', "en-" + this.selectLang2.name)
        localStorage.setItem('lang2', this.selectLang2.name)
      }

      this.i18nShow = !this.i18nShow;
      this.$i18n.locale = "en-" + this.selectLang2.name;
      this.selectLang = this.selectLang2;
    },
    //点击切换语言
    handleLang(item, index) {
      this.i8nActive = index;
      // process.env.VUE_APP_LOCALE_LANGUAGE  = "en-"+item.name;
      this.selectLang2 = item;
    },
    handleStart() {
      let that = this;
      this.active = true;
      setTimeout(() => {
        //  that.$store.dispatch('game/updataeOpengame');
        that.poster = false;
      }, 1500)

    },
  },
}
</script>
<style>
.i18n-box {
  max-height: 60vh;
  width: 86vw;
  background: #fff;
  border-radius: 10px;
  position: relative;
  padding: 10px;
  padding-top: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

.i18n-box-item {
  width: 75px;
  height: 75px;
  background: #F2EAFF;

  border-radius: 50%;
  margin-right: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  /* border-radius:10px;
  border: 1px solid #ddd;
  padding:5px; */
  /* margin-right: 15px;
  margin-bottom: 15px; */

}

.i18n-box-item:nth-child(3n+3) {
  margin-right: 0px;
}

.i8nActive {
  border: 1.5px solid #8D60FB;
}

.i18n-top {
  height: 50px;
  line-height: 50px;
  position: relative;
  text-align: center;
  font-size: 18px;
  font-family: PingFang SC;
  font-weight: 600;
  color: #020202;
}

/* .i18n-box-item:nth-child(4n+4){
  margin-right:0px;
} */
.i18n-close {
  position: absolute;
  top: 1px;
  right: 20px;
}

.i18n-img-box {

  display: flex;
  justify-content: center;
  align-items: center;
}

.i18n-img {
  width: 35px;
  height: 28px;
}

.i18n-txt {
  text-align: center;
  margin-top: 5px;
}

.van-sticky--fixed {
  background-color: #0A0C1D;
}
</style>
<style lang="css" scoped>
.header-top {
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
}

.top-ang-txt {
  margin: 0 3px;
}

.header-top .lt {
  display: flex;
  align-items: center;
  margin-left: 12px;
}

.header-top .rt {
  margin-right: 10px;
  /* display: flex;
  justify-content: center;
  align-items: center;
  min-width: 40px;
  height: 22px;
  background: #FFFFFF;
  border-radius: 4px;
  padding:0 5px;
  margin-right: 12px; */
}

.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

:root {
  --van-sticky-z-inde-background-color: #0A0C1D;
}

.header-sticky {
  background-color: #0A0C1D;
}

/****/
.poster {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

}

.poster .title {
  text-align: center;
  margin-bottom: 10px;
  color: #fff;
  font-size: 20px;
}

.poster .info {
  text-align: center;
  margin-bottom: 40px;
  color: #f5f5f5;
  font-size: 16px;
}

.poster .btn {
  display: inline-block;
  height: 60px;
  position: relative;
  margin: 0 auto;
}

.poster .btn img {
  height: 60px;

}

/* .btn_active{
     display: inline-block;
     height: 60px;
     position: relative;
} */
/* 下面设计 发光效果 */
.poster .btn::before,
.btn_active::before {
  content: '';
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: -1px;
  right: -1px;
  border-radius: 10px;
  /* 背景渐变色 */
  background-image: linear-gradient(to right, #f9e10a, #dcc922, #ffeb3b, #ffed47);
  /* 背景渐变色大小 */
  background-size: 400%;
  /* 元素的位置 底层或者顶层  -值表示底层 + 值表示顶层 */
  z-index: -1;
  /* 设置模糊度 显示发光效果 */
  filter: blur(10px);
}

.poster .btn_active::before {
  /* 动画 名称 时间 infinite 是无限次播放 */
  animation: sun 2s infinite;
}

.poster .btn_active:hover::before {
  animation: sun 2s infinite;
}

@keyframes sun {
  100% {
    /* 背景位置 */
    background-position: -400% 0;
  }
}
</style>
