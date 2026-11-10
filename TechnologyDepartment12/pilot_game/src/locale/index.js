import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)
const locale = localStorage.getItem('lang') || 'en-EN'
const i18n = new VueI18n({
	locale: locale,
	fallbackLocale: 'en-EN',
	silentFallbackWarn: true,
	messages: {
		'en-EN': require("@/locale/en-EN.json"),
		'en-TW': require("@/locale/en-TW.json"),
		'en-IDN': require("@/locale/en-IDN.json"),
		'en-PH': require("@/locale/en-PH.json"),
		'en-TH': require("@/locale/en-TH.json"),
		'en-VN': require("@/locale/en-VN.json"),
		'en-MY': require("@/locale/en-MY.json"),
		'en-FR': require("@/locale/en-FR.json")
	}
})

export default i18n