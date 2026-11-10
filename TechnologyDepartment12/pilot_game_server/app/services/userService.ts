import userDao, { UserDao } from "../dao/userDao";
import { Application, getLogger, Logger } from "pinus";
import { OnlineStatus } from "../consts/code";
import * as https from "https";
import axios from "axios";
import { promisify } from "util";
import recordDao, { RecordDao } from "../dao/recordDao";

export default function (app: Application) {
    return new UserService(app)
}
const logger = getLogger("aviator")

export class UserService {
    private _userDao: UserDao
    private _recordDao: RecordDao;
    private _setting: { notice: boolean, url: string }
    public constructor(private app: Application) {
        this._userDao = userDao(app)
        this._recordDao = recordDao(app)
        this._setting = app.get('setting');
        console.log('constructor---------------this._setting.url:', this._setting);
    }
    /**
     * 根据Id获取玩家信息
     * @param id
     * @returns
     */
    public async getUserInfoById(id: number) {
        let user = await this._userDao.getUserInfoById(id)
        let userResults = user.results
        if (userResults.length !== 1) {
            return null
        }
        return {
            userId: userResults[0].id,
            username: userResults[0].username,
            coin: userResults[0].coin,
            status: userResults[0].status,
        }
    }

    /**
     * 根据Id获取没在游戏中的玩家信息
     * @param id
     * @returns
     */
    public async getHallUserInfoById(id: number) {
        let user = await this._userDao.getHallUserInfoById(id)
        let userResults = user.results
        if (userResults.length !== 1) {
            return null
        }
        return {
            coin: userResults[0].coin
        }
    }



    /**
     * 获取玩家金币
     * @param userId
     * @returns
     */
    public async getUserCoinById(userId: number): Promise<number> {
        let coin = await this._userDao.getUserCoinById(userId)
        let coinResults = coin.results
        if (coinResults.length !== 1) {
            return null
        }
        console.log("转账钱包余额:", coinResults[0].coin);
        return coinResults[0].coin
    }
    /**
     * 加载玩家数据，并且锁住
     * @param userId
     * @returns
     */
    public async loadUserInfo(userId: number, channelId: string | number = null) {
        console.log("--------- public async loadUserInfo(userId: number)-------------");

        let user = await this._userDao.loadUserInfoById(userId);
        let userResults = user.results

        let record = await this._recordDao.userRecordCountByChanel(userId, channelId);
        // let balanceJson = await getBalanceNew(userResults[0].username, userResults[0].channelId, this._setting.url);
        // // let balanceJson = JSON.parse(balanceStr);
        // let coin: number;
        // if (!balanceJson || balanceJson.code != 0) {
        //     coin = 0;
        // } else {
        //     coin = parseFloat(balanceJson.data.balance);
        // }

        // //let coin = await this.axios_getBalance(userResults[0].username, userResults[0].channelId);
        console.log("loadUserInfo--:",userResults[0].winMoneyDay);

        return {
            userId: userResults[0].id,
            username: userResults[0].username,
            coin: 0,
            channelId: userResults[0].channelId,//parseInt(userResults[0].channelId),
            expand: userResults[0].expand,
            merchantId: userResults[0].merchantId,
            proportion: userResults[0].proportion,
            limit: userResults[0].alimit,
            firstPlay: record.results[0],
            winMoney:userResults[0].winMoney,
            winMoneyDay:userResults[0].winMoneyDay,
          
        }
    }

    public async updateMoneyData(userId:number,money:number){
        this._userDao.updateMoneyData(userId,money)
    }

    /**
 * 更新玩家金币
 * @param userId
 * @param coin
 * @returns
 */
    public async updateUserCoin(userId: number, coin: number) {
        return true;
        // let { results } = await this._userDao.updateCoinById(userId, coin)
        // return results.affectedRows === 1
    }

    /**
     * 玩家数据落地
     * @param userId
     * @param coin
     */
    public async unlockCoinById(userId: number) {
        let { results } = await this._userDao.unlockCoinById(userId)
        return results.affectedRows === 1
    }

    /**
     * 更新玩家金币
     * @param userId
     * @param coin
     * @returns
     */
    public async updateUserCoin_racing(userId: number, coin: number) {
        let { results } = await this._userDao.updateCoinById(userId, coin)
        return results.affectedRows === 1
    }

    /**
     * 修改玩家在线状态
     * @param userId
     * @returns
     */
    public async updateUserOnline(userId: number, online: OnlineStatus) {
        let { results } = await this._userDao.updateUserOnlineById(userId, online)
        return results.affectedRows === 1
    }


    /**
     * 批量修改玩家金币
     */
    public async batchUpdateUserCoin() {

    }

    /**
     * 用户上分更新金币
     * @param userId
     * @param userCoin
     * @param addCoin
     */
    async updateCoin(userId: number, userCoin: number, coin: number) {

        //let { results } = await this._userDao.updateCoin(userId, userCoin, coin)
        // return results.affectedRows === 1;
        return true;
    }
    /**
     * 用户下分更新金币
     * @param userId
     * @param userCoin
     * @param addCoin
     */
    async decreaseCoin(userId: number, userCoin: number, coin: number) {
        let { results } = await this._userDao.decreaseCoin(userId, userCoin, coin)
        return results.affectedRows === 1;
    }

    async getChannelInfos(): Promise<{ channelId: number; notifyUrl: string; notifyBalanceUrl: string }[]> {
        let channelInfos = []
        let { results } = await this._userDao.getChannelInfos()
        results.forEach(e => {
            channelInfos.push(e)
        })
        return results
    }

    async updateCoinAndUnlock(userId: number, coin: number) {
        let { results } = await this._userDao.updateCoinAndUnlock(userId, coin)
        return results.affectedRows === 1
    }

    async allUserUnlock(userId: number, coin: number) {
        let { results } = await this._userDao.allUserUnlock()
        return results.affectedRows === 1
    }


    /**
    * 更新玩家金币
    * @param username 用户名称
    * @param channelId 渠道ID
    */
    async axios_getBalance(username: string, channelId: string) {
        let coin = -1
        await axios.post(this._setting.url + '/getBalance', { username: username, channelId: channelId })
            .then(async (res: any) => {
                let str = JSON.stringify(res.data)
                let data = JSON.parse(str.toString())
                if (data.code == 0) {
                    coin = await data.data.balance
                }
            }).catch((error) => {
                logger.error('axios_getBalance error:' + error)
            })
        return coin
    }

    /**
     * 下注
     * @param username 用户名称
     * @param channelId 渠道ID
     * @param amount 获胜金额
     * @param refId 订单id
     */
    public async axios_bet(username: string, channelId: string, amount: number, refId: string) {
        let yue = 0
        await axios.post(this._setting.url + '/bet',
            { username: username, channelId: channelId, amount: amount, refId: refId })
            .then((res: any) => {
                let str = JSON.stringify(res.data)
                let data = JSON.parse(str.toString())
                if (data.code == 0) {
                    yue = data.data.balance
                } else {
                    yue = 0
                }
            }).catch((error) => {
                logger.error('axios_bet error:' + error)
            })
        return yue
    }

    /**
     * 取消下注
     * @param username 用户名称
     * @param channel 渠道ID
     * @param refId 订单id
     * @param amount 下注金额
     */
    public async axios_unbet(username: string, channel: string, refId: string, amount: string) {
        let isOk = false
        await axios.post(this._setting.url + '/unbet',
            { username: username, channelId: channel, refId: refId, amount: amount })
            .then(async res => {
                let str = JSON.stringify(res.data)
                let data = JSON.parse(str.toString())
                if (data.code == 0) {
                    isOk = await true
                } else {
                    isOk = await false
                }

            }).catch((error) => {
                logger.error('axios_unbet error:' + error)
            })
        return isOk
    }

    /**
     * 结算开奖
     * @param username 用户名称
     * @param channelId 渠道ID
     * @param rewardAmount 获胜金额
     * @param refId 订单id
     */
    public async axios_settle(username: string, channelId: string, rewardAmount: number, refId: string) {
        let isOk = false
        await axios.post(this._setting.url + '/settle',
            { username: username, channelId: channelId, rewardAmount: rewardAmount, refId: refId }).then(async res => {
                let str = JSON.stringify(res.data)
                let data = JSON.parse(str.toString())

                if (data.code == 0) {
                    // if (rewardAmount != 0) {
                    //     isOk = await true
                    // }
                    isOk = await true
                } else {
                    isOk = await false
                }
            }).catch((error) => {
                logger.warn('axios_settle error:', error)
            })
        return isOk
    }

    /** 离线通知 */
    public async noticeOffline(userInfos: { username: string, channelId: any }[]) {

        logger.warn('this is noticeOffline:', userInfos[0].channelId)

        if (!this._setting.notice) {
            return
        }
        let channelInfos = []
        try {
            channelInfos = await this.getChannelInfos()
        } catch (err) {
            logger.warn('get channel info fail' + err)
            return
        }
        https.get[promisify.custom] = function (url) {

            return new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    if (res.statusCode !== 200) {
                        reject(res.statusMessage)
                        return
                    }
                    res.on("data", (data) => {
                        let obj = JSON.parse(data.toString())
                        if (obj.code === 1) {
                            resolve('success')
                        } else {
                            reject('error code')
                        }
                    })
                }).on('error', err => {
                    reject(err)
                })
            })
        }
        const aget = promisify(https.get)
        let task = []

        userInfos.forEach(e => {
            const channelInfo = channelInfos.find(e1 => e.channelId == e1.channelId)
            logger.warn('!channelInfo || !channelInfo.offlineUrl:', channelInfo)
            if (!channelInfo || !channelInfo.offlineUrl) {
                return;
            }
            task.push(aget(channelInfo.offlineUrl + '?' + 'username=' + e.username).catch(err => {
                logger.warn(e.username + ' notice offline fail: ' + err)
            }).finally(() => {
                // logger.log('aget notice offline finally: ')
            }))
        })
        console.log("notice offline fail task.length :", task.length);
        if (task.length > 0) {
            Promise.all(task).catch(e => {
                //  logger.warn('notice offline fail')
            }).finally(() => {
                //  logger.warn('Promise notice offline finally: ')
            })
        }
    }

    /** 通知商户 */
    public async notice(userInfos: { username: string, channelId: any }[]) {
        return;
        // logger.warn('通知商户:', userInfos[0].channelId)
        // if (!this._setting.notice) {
        //     return
        // }
        // let channelInfos = []
        // try {
        //     channelInfos = await this.getChannelInfos()
        // } catch (err) {
        //     logger.warn('------------------get channel info fail' + err)
        //     return
        // }
        // https.get[promisify.custom] = function (url) {
        //     console.log("https.get[promisify.custom]:", url);
        //     return new Promise((resolve, reject) => {
        //         https.get(url, (res) => {
        //             res.statusCode === 200 ? resolve(res.statusMessage) : reject(res.statusMessage)
        //         })
        //     })
        // }
        // const aget = promisify(https.get)
        // let task = []
        // userInfos.forEach(e => {

        //     const channelInfo = channelInfos.find(e2 => e2.channelId === e.channelId)
        //     if (!channelInfo || !channelInfo.notifyUrl) {
        //         return;
        //     }
        //     task.push(aget(channelInfo.notifyUrl + '?' + 'username=' + e.username))
        // })
        // if (task.length > 0) {
        //     Promise.all(task).catch(e => {
        //         logger.warn('notice fail')
        //     })
        // }
    }


    public async unlockCoin(userId: number) {
        return await this.unlockCoinById(userId)
    }

}
