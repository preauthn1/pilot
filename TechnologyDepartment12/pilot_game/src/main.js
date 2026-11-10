import Vue from 'vue'
import i18n from './locale'
import Vant from 'vant'
import './assets/js/pinus'
import store from './store'
import App from './App.vue'
import 'vant/lib/index.less'
import './assets/css/index.less'
import gsap from "gsap"
Vue.config.productionTip = false
Vue.use(Vant);
Vue.prototype.gsap = gsap
Vue.config.silent = true
// filter
Vue.filter('numberFormat', function(value) {
  return ((+value || 0) / 100).toFixed(2)
})
const app= new Vue({
  store,
  i18n,
  render: h => h(App)
})
app.$mount('#app')

  