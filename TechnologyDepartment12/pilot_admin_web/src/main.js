import Vue from 'vue'
import './assets/js/pinus'
import App from './App'
import i18n from './i18n'
import store from './store'
import router from './router'
import permission from '@/directive/permission/index.js' // 权限判断指令
import numberOnly from '@/directive/number-only'
import DfButton from '@/vab/components/DfButton'
import elDragDialog from '@/directive/el-drag-dialog'
import VueQuillEditor from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
import * as util from '@/utils'
import * as filters from '@/filters' // global filters
import '@/vab'

/**
 * @description 正式环境默认使用mock，正式项目记得注释后再打包
 */
/*if (process.env.NODE_ENV === 'production') {
  const { mockXHR } = require('@/utils/static')
  mockXHR()
}*/
Vue.directive('permission', permission)
Vue.directive('elDragDialog', elDragDialog)
Vue.directive('numberOnly', numberOnly) // 只能输入数字指令
Vue.component('DfButton', DfButton)
Vue.config.productionTip = false
Vue.prototype.$util = util
Vue.use(VueQuillEditor)
// register global utility filters
Object.keys(filters).forEach((key) => {
  Vue.filter(key, filters[key])
})

new Vue({
  el: '#admin-pro',
  i18n,
  store,
  router,
  render: (h) => h(App),
})
