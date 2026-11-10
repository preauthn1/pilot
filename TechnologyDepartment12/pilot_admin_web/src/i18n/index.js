import Vue from 'vue'
import VueI18n from 'vue-i18n'
import store from '../store'
import elementEnLocale from 'element-ui/lib/locale/lang/en' // element-ui lang
import elementZhLocale from 'element-ui/lib/locale/lang/zh-CN' // element-ui lang
import enLocale from './en'
import zhLocale from './zh'

Vue.use(VueI18n)

const messages = {
  en: {
    ...enLocale,
    ...elementEnLocale,
  },
  'zh-CN': {
    ...zhLocale,
    ...elementZhLocale,
  },
}
export function getLanguage() {
  document.documentElement.lang = store.getters['settings/language'] || 'zh-CN'
  return store.getters['settings/language'] || 'zh-CN'
}
const i18n = new VueI18n({
  // set locale
  // options: en | zh | es
  locale: getLanguage(),
  // set locale messages
  messages,
})

export default i18n
