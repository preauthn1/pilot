import {mapGetters} from "vuex";
import { paramObj } from '@/common/util'
import { automaticLogin } from '@/api'
export default {
    data() {
        return {
            overlay: true,
            isStart:false,
            poster:true,
        }
    },
    computed: {
        ...mapGetters({
            pomelo: 'client/pomelo',
            status: 'game/status',
            connected: 'client/connected',
            currentMultiple: 'game/currentMultiple',
            openGame: 'game/openGame'
        })
    },
    watch: {
        status(val) {
            if (val === 0) {
                 this.$store.commit('record/resetBetList', {})
            }
        },
        connected(current, orgin) {
            if (current && !orgin) {
                 this.enter()
            }
        },
        openGame(val){
            if(val){
                this.init();
            }
        },
    },
    created() {
        this.init();
        this.getToken();
    },
    mounted() {
        
        
    },
    methods: {
        getConfig(url){
            // 根据token获取服务器配置
             let token = paramObj(url).token
            if (!token) {
                this.showDialog(this.$t('tips.token_error'))
                return false
            } else {
                this.$store.dispatch('settings/setSettings', token).then((data) => {
                    this.$store.commit('client/setAddress', data.server.address)
                    this.$store.commit('client/setProto', data.server.protocol)
                    this.$store.commit('client/setToken', data.token)
                    this.$store.commit('client/setTag',data.tag)
                    this.$store.dispatch('client/connect').then(() => {
                        this.$store.commit('client/setPageLoad');
                        console.log('connection succeeded')
                    }).catch(e => {
                        console.log(e)
                        //失败弹窗
                        this.showDialog(this.$t('tips.connect_fail'))
                    })
                }).catch(() => {
                    this.showDialog(this.$t('tips.request_fail'))
                })
            }
        },
       async getToken(){
            //automaticLogin
            let username = localStorage.getItem('username')||'';
            const res = await automaticLogin(username);
            if(res.code == 0){
                localStorage.setItem('username',res.data.username);
                this.getConfig(res.data.url);
            }
        },

        init(){
                 // 监听状态数据
                this.pomelo.on('disconnect', () => {
                    this.$store.commit('client/disconnected')
                })
                this.pomelo.on('status', (data) => {
                    this.$store.dispatch('game/updateStatus', data.status)
                        this.$store.dispatch('game/setWaitTime', data.duration || 0)
                    // 游戏结束，记录数据
                    if (data.status === 2 && this.currentMultiple > 0) {
                        setTimeout(() => {
                            this.$store.dispatch('record/addHistoryList', this.currentMultiple)
                        }, 500)
                    }
                })
                this.pomelo.on('syncPoint', (data) => {
                    this.$store.dispatch('game/updateMultiple', data.multiple)
                })
                this.pomelo.on('bet', (data) => {
                    this.$store.commit('record/addBetList', data)
                })
                this.pomelo.on('cancel', (data) => {
                    this.$store.commit('record/delBetList', data)
                })
                this.pomelo.on('cashOut', (data) => {
                    this.$store.commit('record/updateBetList', data)
                })
                this.pomelo.on('syncProp', (data) => {
                    this.$store.commit('user/updateUserInfo', data)
                })
           
       },
        enter() {
            this.pomelo.request('aviator.aviatorHandler.enterRequest', {}, (data) => {
                if (data.code > 0) {
                    this.showDialog(this.$t('tips.enter_error'))
                    return
                }
                this.$store.commit('user/init', data.data.userInfo)
                this.$store.dispatch('game/updateStatus', data.data.status)
                // 历史记录
                this.$store.dispatch('record/setHistoryList', data.data.history)
                // 游戏中数据处理
                if(data.data.status === 1) {
                    const {betInfo, betList, syncPoint} = data.data.statusData
                    // 同步已有的倍数值
                    this.$store.dispatch('game/setSyncPoint', syncPoint)
                    // 注单列表同步
                    this.$store.commit('record/initBetList', betList)
                    // 注单信息还原
                    this.$store.commit('user/setBetInfo', betInfo)
                }
                // 距离游戏开始时间
                if (data.data.status === 0 && data.data.statusData) {
                     this.$store.commit('game/setWaitTime', data.data.statusData.leftTime || 0)
                }
            })
        },
        showDialog(msg) {
            this.$dialog.alert({
                message: msg,
                confirmButtonText: this.$t('btn.confirm'),
                theme: 'round-button',
            }).then(() => {
                 window.location.href = '404.html'
            })
        }
    }
}
