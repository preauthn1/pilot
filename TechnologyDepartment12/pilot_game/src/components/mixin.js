import {mapGetters} from "vuex";
import { paramObj } from '@/common/util';
import { automaticLogin } from '@/api'
export default {
    data() {
        return {
            overlay: true,
            progressTime:null,
            progressNum:20,
            progressShow:false,
            channelId: null,
            connectionError: ''
        }
    },
    computed: {
        ...mapGetters({
            pomelo: 'client/pomelo',
            status: 'game/status',
            connected: 'client/connected',
            currentMultiple: 'game/currentMultiple',
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
        }
    },
    created() {
        // 监听状态数据
        this.pomelo.on('disconnect', () => {
            this.$store.commit('client/disconnected')
        })
        this.pomelo.on('status', (data) => {
            this.$store.dispatch('game/updateStatus', data.status)
            this.$store.dispatch('game/setWaitTime', data.duration || 0)
            // 游戏结束，记录数据
            // console.log(data);
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
            console.log(data)
            this.$store.commit('user/updateUserInfo', data)
        })
    },
    mounted() {
        // 根据token获取服务器配置
        let token = paramObj(location.href).token;
        let lang = paramObj(location.href).lang;
        if(lang){
            this.$i18n.locale = 'en-'+lang;
            localStorage.setItem('lang',"en-"+lang)
        }
        this.progressTime = setInterval(()=>{
               !this.progressShow && this.progressNum < 100 ? this.$store.commit('game/updataProgress',this.progressNum+=1):clearInterval(this.progressTime);
               if(this.progressNum>=99){
                 clearInterval(this.progressTime);
               }
        },50)
        token? this.getConfig(token) : this.getToken();
  
    },
    methods: {
        getConfig(token){
            this.connectionError = ''
           
            // if (!token) {
            //     this.showDialog(this.$t('tips.token_error'))
            //     return false
            // } else {
                this.$store.dispatch('settings/setSettings', token).then((data) => {
                    const wsAddress = process.env.VUE_APP_WS_ADDRESS || data.server.address
                    const wsProtocol = process.env.VUE_APP_WS_PROTOCOL || data.server.protocol

                    this.$store.commit('client/setAddress', wsAddress)
                    this.$store.commit('client/setProto', wsProtocol)
                    this.$store.commit('client/setToken', data.token)
                    this.$store.commit('client/setTag',data.tag)  
                    this.channelId = data.game.channel
                    this.$store.commit('client/setChannelId', data.game.channel)
                    this.$store.commit('client/setGameTag', data.gameTag)
                    this.$store.commit('client/setGameCode', data.gameCode)
                    this.$store.dispatch('client/connect').then(() => {
                        this.connectionError = ''
                        console.log('connection succeeded')
                        this.progressNum = 99;
                        this.$nextTick(()=>{
                            this.$store.commit('client/setPageLoad');
                            clearInterval(this.progressTime);
                            this.progressShow = true
                            this.$store.commit('game/updataProgress',100);
                        })
                    }).catch(e => {
                        console.log(e)
                        this.connectionError = this.$t('tips.connect_fail')
                    })
                }).catch(() => {
                    this.connectionError = this.$t('tips.request_fail')
                })
            // }
        },
        retryConnection(){
            window.location.reload()
        },
        async getToken(){
            //automaticLogin
            let username = localStorage.getItem('username')||'';
            if (username === 'undefined' || username === 'null') {
                username = ''
            }
            const res = await automaticLogin(username);
            if(res.code == 0){
                localStorage.setItem('username',res.data.username);
                // 新增：保存登录返回的 channelId 到 data 中
                if (res.data.channelId) {
                    this.channelId = res.data.channelId;
                }
                let token = paramObj(res.data.url).token;
                this.getConfig(token);
            }else{
                this.showDialog(this.$t('tips.token_error'))
                return false
            }
        },
        enter() {
            const channelId = this.channelId || this.$store.getters['client/channelId']
            this.pomelo.request('aviator.aviatorHandler.enterRequest', {channelId}, (data) => {
                console.log(data)
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
                // window.location.href = '404.html'
                window.parent.location.reload();
            })
        }
    }
}
