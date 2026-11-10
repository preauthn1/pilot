import { Application } from "pinus";
import { Dao, DbFieldInfo } from "./dao";


export default function (app: Application) {
    return new UserDao(app)
}

export class UserDao extends Dao {

    public constructor(app: Application) {
        super(app)
    }

    public getHallUserInfoById(id: number) {
        const sql = 'SELECT u.id, u.username, c.coin from ums_user u INNER JOIN ums_coin c  ON u.id = c.user_id WHERE u.id = ? and game_lock = 0'
        const args = [id]
        return this.select(sql, args)
    }

    public getUserInfoById(id: number) {
        const sql = 'SELECT u.id, u.username, c.coin, u.status from ums_user u INNER JOIN ums_coin c  ON u.id = c.user_id WHERE u.id = ?'
        const args = [id]
        return this.select(sql, args)
    }

    public transformId(channelId: number, username: string) {
        const sql = 'select id from ums_user where channel_id = ? and username = ?'
        const args = [channelId, username]
        return this.select(sql, args)
    }

    public getUserCoinById(id: number) {
        const sql = 'SELECT coin from ums_coin WHERE user_id = ?'
        const args = [id]
        return this.select(sql, args)
    }

    public unlockCoinById(id: number) {
        const sql = 'update ums_coin set is_lock = 0 where user_id = ? and is_lock = 1'
        const args = [id]
        return this.select(sql, args)
    }

    public updateCoinById(id: number, coin: number) {
        return;
        const sql = 'update ums_coin set coin = ? where user_id = ? and is_lock = 1'
        const args = [coin, id]
        return this.select(sql, args)
    }

    public updateUserOnlineById(userId: number, online: number) {
        const sql = 'update ums_user set online = ? where id = ?'
        const args = [online, userId];
        const unLock = 'update ums_coin set is_lock = 0 where user_id = ? and is_lock = 1';
        const args1 = [userId];
        this.select(unLock, args1)
        return this.select(sql, args)
    }

    /**
     * 加载数据
     */
    public async loadUserInfoById(id: number): Promise<{ results?: any, fields?: DbFieldInfo[] }> {
        const connection = await this.getConnection()
        try {
            await this.beginTransaction(connection)
        } catch (e) {
            connection.release()
            throw e
        }
        const update = 'update ums_coin set is_lock = 1 where user_id = ? and is_lock = 0';
        let args = [id]
        try {
            // let {results} = await this.update(update, args, connection)
            // if(results.affectedRows !== 1) {
            //     throw 'user data is lock'
            // }
            //const select = 'SELECT u.id, u.username,u.channel_id as channelId, u.expand ,u.merchant_id as merchantId from ums_user u WHERE u.id = ?'
            const select = 'SELECT u.id, u.username, u.channel_id as channelId, u.expand ,u.merchant_id as merchantId, '
                + 'c.win_proportion as proportion, c.win_limit as alimit,'
                + 'win_money as winMoney, win_money_day as winMoneyDay '
                + 'from ums_user u INNER JOIN mms_merchant c'
                + ' ON u.merchant_id = c.id WHERE u.id = ?'

            args = [id]
            let selectResult = await this.select(select, args, connection);
            if (selectResult.results.length !== 1) {
                throw 'user data error';
            }
            await this.commit(connection)
            connection.release()
            return selectResult
        } catch (e) {
            await this.rollback(connection)
            connection.release()
            throw e
        }
    }

    public updateMoneyData(userId: number,money:number){
        const sql = 'update ums_user set win_money = ?,win_money_day = ? where id = ?'
        const args = [money,new Date, userId]
        return this.select(sql, args)
    }

    async updateCoin(userId: number, userCoin: number, coin: number) {
        const totalCoin = userCoin + coin
        const sql = 'update ums_coin set coin = ? where user_id = ? and is_lock = 1 and coin = ?'
        const args = [totalCoin, userId, userCoin]
        return this.select(sql, args)
    }

    async decreaseCoin(userId: number, userCoin: number, coin: number) {
        let totalCoin = userCoin + coin
        if (coin === 0) {
            totalCoin = 0
        }
        const sql = 'update ums_coin set coin = ? where user_id = ? and is_lock = 1 and coin = ?'
        const args = [totalCoin, userId, userCoin]
        return this.select(sql, args)
    }

    public getChannelInfos() {
        const sql = 'SELECT id as channelId, notify_url as notifyUrl, offline_url as offlineUrl   from mms_channel'
        const args = []
        return this.select(sql, args)
    }

    async updateCoinAndUnlock(userId: number, coin: number) {
        const sql = 'update ums_coin set coin = ?, is_lock = 0 where user_id = ? and is_lock = 1'
        const args = [coin, userId]
        return this.select(sql, args)
    }

    async allUserUnlock() {
        const sql = 'update ums_coin set is_lock = 0 where is_lock = 1'
        const args = []
        return this.select(sql, args)
    }
    
}
