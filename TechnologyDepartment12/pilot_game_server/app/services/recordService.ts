import { Application, BackendSession } from "pinus"
import recordDao, { RecordDao } from "../dao/recordDao"


export default function (app: Application) {
    return new RecordService(app)
}

export class RecordService {
    private _recordDao: RecordDao

    public constructor(private app: Application) {
        this._recordDao = recordDao(app)
    }

    // 通用---------------------------------------->  用户游戏记录(前20条)
    // 渠道id已经通过用户id区分开了，不需要再次区分，意思是，直接查询用户即可
    public async userRecordA(uid: number) {
        let recordList = await this._recordDao.userRecordA(uid)
        let userRecordResult = recordList.results;
        if (userRecordResult.length == 0) {
            return []
        }
        return userRecordResult;
    }
    // 通用----------------------------------------> 查询赢钱排行（前20） 赔付排名
    public async cashOutRankA(gamTag: number) {
        let recordList = await this._recordDao.cashOutRankA(gamTag)
        let userWinResult = recordList.results;
        if (userWinResult.length == 0) {
            return []
        }
        userWinResult.forEach(e => {
            e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })
        return userWinResult;
    }
    // 通用----------------------------------------> 查询赢钱排行（前20） 倍率排名
    public async multipleRankA(gamTag: number) {
        let recordList = await this._recordDao.multipleRankA(gamTag)
        let userWinResult = recordList.results;
        if (userWinResult.length == 0) {
            return []
        }
        userWinResult.forEach(e => {
            e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })
        return userWinResult;
    }
    public async allBets(gamTag: number) {
        let recordList = await this._recordDao.allBets(gamTag)
        let userWinResult = recordList.results;
        if (userWinResult.length == 0) {
            return []
        }
        userWinResult.forEach(e => {
            e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })
        return userWinResult;
    }
    public async hightRollers(gamTag: number) {
        let recordList = await this._recordDao.hightRollers(gamTag)
        let userWinResult = recordList.results;
        if (userWinResult.length == 0) {
            return []
        }
        userWinResult.forEach(e => {
            e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })
        return userWinResult;
    }
    public async rareWins(gamTag: number) {
        let recordList = await this._recordDao.rareWins(gamTag)
        let userWinResult = recordList.results;
        if (userWinResult.length == 0) {
            return []
        }
        userWinResult.forEach(e => {
            e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })
        return userWinResult;
    }
    // 通用----------------------------------------> 用户游戏记录入库
    public async saveBetRecordA(betInfo: any, userInfo: any) {
        let values = []
        let sqlParam = []
        sqlParam.push(betInfo.userId)
        sqlParam.push(userInfo.username)
        sqlParam.push(betInfo.index)
        sqlParam.push(betInfo.betCount)
        sqlParam.push(betInfo.auto)
        sqlParam.push(betInfo.multiple * 100)
        sqlParam.push(betInfo.multiple * betInfo.betCount)//betInfo.payout
        sqlParam.push(betInfo.betTime)
        sqlParam.push(new Date())//betInfo.finishTime
        sqlParam.push(betInfo.beforCoin)//下注后余额
        sqlParam.push(betInfo.afterCoin)//派彩余额
        sqlParam.push(betInfo.expand)
        sqlParam.push(betInfo.CoinTag)
        sqlParam.push(userInfo.gameTag)
        sqlParam.push(null)
        sqlParam.push(null)
        sqlParam.push(new Date())//created_at
        sqlParam.push(new Date())//update_at
        //user_id, user_name, round_id, bet, bet_type, settlement_multiple, pay_out, bet_time, finish_time, 
        //before_coin, after_coin, expand, tag, game_tag, sys_map_data,click_map_data,created_at

        values.push(sqlParam)

        this._recordDao.insertBetRecordA(sqlParam)
    }

    // 查询赢钱排行（前20）
    public async cashOutRank(tag?: string) {
        let recordList = await this._recordDao.cashOutRank(tag)
        let userWinResult = recordList.results;
        if (userWinResult.length == 0) {
            return []
        }
        userWinResult.forEach(e => {
            e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })

        return userWinResult;
    }

    // 查询赢钱排行（前20）
    public async cashOutRank_jump() {
        let recordList = await this._recordDao.cashOutRank_jump()
        let userWinResult = recordList.results;
        if (userWinResult.length == 0) {
            return []
        }
        userWinResult.forEach(e => {
            e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })

        return userWinResult;
    }

    // 查询赢钱排行（前20）
    public async cashOutRank_pirate(data: { onlySelf: boolean, type: string, curr: string }, userId) {
        let recordList = await this._recordDao.cashOutRank_pirate(data, userId);
        let userWinResult = recordList.results;
        if (userWinResult.length == 0) {
            return []
        }
        if (!data.onlySelf) {
            userWinResult.forEach(e => {
                e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
            })
        }
        return userWinResult;
    }

    // 查询赢钱排行（前20）
    public async cashOutRank_racing() {
        let recordList = await this._recordDao.cashOutRank_racing()
        let userWinResult = recordList.results;
        if (userWinResult.length == 0) {
            return []
        }
        userWinResult.forEach(e => {
            e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })
        return userWinResult;
    }

    // 获取最大倍数记录（前20）
    public async multipleRank(tag?: string) {
        let recordList = await this._recordDao.multipleRank(tag)
        let userMultResult = recordList.results;
        if (userMultResult.length == 0) {
            return []
        }
        userMultResult.forEach(e => {
            e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })
        return userMultResult;
    }

    // 获取最大倍数记录（前20）
    public async multipleRank_jump() {
        let recordList = await this._recordDao.multipleRank_jump()
        let userMultResult = recordList.results;
        if (userMultResult.length == 0) {
            return []
        }
        userMultResult.forEach(e => {
            e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })
        return userMultResult;
    }

    // 获取最大倍数记录（前20）
    public async multipleRankMines() {
        let recordList = await this._recordDao.multipleRankMines()
        let userMultResult = recordList.results;
        if (userMultResult.length == 0) {
            return []
        }
        userMultResult.forEach(e => {
            e.userName = e.userName.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })
        return userMultResult;
    }

    // 用户游戏记录(前20条)
    public async userRecord_pirate(uid: number) {
        let recordList = await this._recordDao.userRecord_pirate(uid)
        let userRecordResult = recordList.results;
        if (userRecordResult.length == 0) {
            return []
        }
        // userRecordResult.forEach(e => {
        //     e.userName = e.userName.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        // })
        return userRecordResult;
    }

    // 按日期查询用户游戏记录
    public async userRecordByDate( uid:number, param:{channel: string | number, type: number, start: string, end: string, index: number}) {
        let recordList = await this._recordDao.userRecordByDate(uid,param)
        let userRecordResult = recordList.results;
        if (userRecordResult.length == 0) {
            return []
        }
        return userRecordResult;
    }


    // 用户游戏记录(前20条)
    public async userRecord(uid: number, tag?: string) {
        let recordList = await this._recordDao.userRecord(uid, tag)
        let userRecordResult = recordList.results;
        if (userRecordResult.length == 0) {
            return []
        }
        return userRecordResult;
    }
    // 用户游戏记录(前20条)
    public async userRecord_racing(uid: number) {
        let recordList = await this._recordDao.userRecord_racing(uid)
        let userRecordResult = recordList.results;
        if (userRecordResult.length == 0) {
            return []
        }
        return userRecordResult;
    }

    // 用户游戏记录(前20条)
    public async userRecord_jump(uid: number) {
        let recordList = await this._recordDao.userRecord_jump(uid)
        let userRecordResult = recordList.results;
        if (userRecordResult.length == 0) {
            return []
        }
        return userRecordResult;
    }

    // 用户游戏记录(前20条)
    public async userRecordMines(uid: number) {
        let recordList = await this._recordDao.userRecordMines(uid)
        let userRecordResult = recordList.results;
        if (userRecordResult.length == 0) {
            return []
        }
        return userRecordResult;
    }

    // 游戏记录入库 
    public async saveGameRecord(settlement: number, roundId: number, result: number, endType: number, operatorId: number, channelID: number, rebate: number = 0) {
        let { results } = await this._recordDao.insertGameRecord(settlement, roundId, result, endType, operatorId, channelID, rebate)
        return results.affectedRows === 1
    }

    public async saveAviatorGameRecord(settlement: number, roundId: number, result: number, endType: number, operatorId: number, channelID: number, gameCode: string, rebate: number = 0) {
        let { results } = await this._recordDao.insertGameRecord(settlement, roundId, result, endType, operatorId, channelID, rebate, gameCode)
        return results.affectedRows === 1
    }

    // 游戏记录入库
    public async saveGameRecord_jump(settlement: number, roundId: string, result: number, endType: number, operatorId: number, rebate: number = 0) {
        let { results } = await this._recordDao.insertGameRecord_jump(settlement, roundId, result, endType, operatorId, rebate)
        return results.affectedRows === 1
    }


    // 游戏记录入库
    public async saveGameRecord_pirate(settlement: number, roundId: string, result: number, endType: number, operatorId: number, rebate: number = 0) {
        let { results } = await this._recordDao.insertGameRecord_pirate(settlement, roundId, result, endType, operatorId, rebate)
        return results.affectedRows === 1
    }

    // 游戏记录入库
    public async saveGameRecord_racing(settlement: number, roundId: number, result: number, endType: number, operatorId: number, channelId, rebate: number = 0) {
        //let { results2 } = await this._recordDao.insertGameRecord_racing(settlement, roundId, result, endType, operatorId,channelId)
        let { results } = await this._recordDao.insertGameRecord(settlement, roundId, result, endType, operatorId, channelId, rebate)

        return results.affectedRows === 1
    }

    // 用户游戏记录入库
    public async saveBetRecord_jump(v) {
        let values = []
        v.push(new Date())              //created_at
        values.push(v);
        this._recordDao.insertBetRecord_jump(values)
    }
    // 用户游戏记录入库
    public async saveBetRecord_pirate(v) {
        let values = []
        v.push(new Date())              //created_at
        values.push(v);
        this._recordDao.insertBetRecord_pirate(values)
    }

    // 用户游戏记录入库
    public async saveBetRecord_racing(betInfos: {
        userId: number, data: { index: number, betCount: number }[], betTime: Date, finishTime: Date, beforCoin: number,
        afterCoin: number, betCount: number, payOut: number, tag: string, winNum: number
    }[],
        userInfos: any[], roundId: number, robotBetInfos: any[], channelId) {

        let values = []
        if (betInfos.length !== 0) {
            betInfos.forEach(e => {
                //console.log("用户游戏记录入库:",e);

                let userInfo = userInfos.find(u => u.userId === e.userId)
                let sqlParam = []
                let finishTime = new Date();
                let betNo_str = "";
                let betCount_str = "";
                e.data.forEach(w => {

                    if (betNo_str == "") {
                        betNo_str += w.index;
                        betCount_str += w.betCount;
                    } else {
                        betNo_str += "_" + w.index
                        betCount_str += "_" + w.betCount;
                    }
                })

                sqlParam.push(e.userId)
                sqlParam.push(userInfo.username)
                sqlParam.push(roundId)
                sqlParam.push(e.betCount)                                         // 0
                sqlParam.push(1)                        //e.auto        o          
                sqlParam.push(1)                        //multiple      o
                sqlParam.push(e.payOut)               //payOut                    -1
                sqlParam.push(e.betTime)                //betTime       o          
                sqlParam.push(finishTime)               //finishTime    o
                sqlParam.push(e.beforCoin)               //beforCoin     o         90721398
                sqlParam.push(e.afterCoin)                //afterCoin               -1
                sqlParam.push(userInfo.expand)
                sqlParam.push(betNo_str)          //betNo_str
                sqlParam.push(betCount_str)          //betCount_str
                sqlParam.push(3)                    //game_tag
                sqlParam.push(e.tag)                    //tag   币种
                sqlParam.push(e.winNum)                    //tag   币种
                sqlParam.push(channelId)
                sqlParam.push(Math.floor(e.betTime.getTime() / 1000));       //时间戳
                sqlParam.push(new Date());                               //created_at
                sqlParam.push(new Date());                               //update_at
                values.push(sqlParam)

            })
        }
        if (robotBetInfos.length !== 0) {

            robotBetInfos.forEach(e => {

                //      let userInfo = userInfos.find(u => u.userId === e.userId)
                let sqlParam = []
                let finishTime = new Date()
                let betNo_str = "";
                let betCount_str = "";
                e.data.forEach(w => {

                    if (betNo_str == "") {
                        betNo_str += w.index;
                        betCount_str += w.betCount;
                    } else {
                        betNo_str += "_" + w.index
                        betCount_str += "_" + w.betCount;
                    }
                })

                sqlParam.push(e.userId)
                sqlParam.push(e.username)
                sqlParam.push(roundId)
                sqlParam.push(e.betCount)
                sqlParam.push(1)                        //e.auto        o
                sqlParam.push(1)                        //multiple      o
                sqlParam.push(e.payOut)               //payOut        
                sqlParam.push(e.betTime)                //betTime       o
                sqlParam.push(finishTime)               //finishTime    o
                sqlParam.push(e.beforCoin)               //beforCoin    o
                sqlParam.push(e.afterCoin)                //afterCoin     
                sqlParam.push("")
                sqlParam.push(betNo_str)          //betNo_str
                sqlParam.push(betCount_str)          //betCount_str
                sqlParam.push(3)                    //game_tag
                sqlParam.push(e.tag)                    //tag   币种
                sqlParam.push(e.winNum)
                sqlParam.push(e.channelId)
                sqlParam.push(Math.floor(e.betTime.getTime() / 1000));       //时间戳
                sqlParam.push(new Date());                               //created_at
                sqlParam.push(new Date());                               //update_at
                values.push(sqlParam)
            })
        }
        const task = []
        let i = 1
        for (; i * 100 < values.length; i++) {
            task.push(this._recordDao.insertBetRecord_racing(values.slice((i - 1) * 100, i * 100)))
        }
        task.push(this._recordDao.insertBetRecord_racing(values.slice((i - 1) * 100, values.length)))
        if (task.length > 0) {
            await Promise.all(task)
        }
    }

    /**
     * @param betInfo {username, round_id, betCount, auto, multiple ,payout  ,  betTime,  finishTime  ,beforCoin, CoinTag, betNo_str,betCount_str,win_car_num}
     */
    public async saveUserData(betInfo: any, userInfo: any) {
        // 用户下注记录入库   游戏记录入库
        let sqlParamArr = [];
        let sqlParam = [];

        sqlParam.push(userInfo.userId);     //'user_id,'
        sqlParam.push(userInfo.username);   //' user_name,' 
        sqlParam.push(betInfo.round_id);       //'round_id,' 

        sqlParam.push(betInfo.betCount);     // ' bet,' +
        sqlParam.push(betInfo.auto);   // 'bet_type,'
        sqlParam.push(betInfo.multiple);       //'settlement_multiple,' 

        sqlParam.push(parseInt(betInfo.payout.toFixed(0)));     //'pay_out,'
        sqlParam.push(betInfo.betTime);   //' bet_time,' +
        sqlParam.push(betInfo.finishTime);       //'finish_time,' +

        sqlParam.push(betInfo.beforCoin);     //'before_coin,'
        sqlParam.push(userInfo.coin);   //' after_coin,' +
        sqlParam.push(userInfo.expand);       //'expand,' +

        sqlParam.push(betInfo.CoinTag);     //'tag,'   币种
        sqlParam.push(betInfo.gameTag);   //' game_tag,' 游戏类型
        sqlParam.push(userInfo.channelId);       //'channel_id,'  渠道ID

        sqlParam.push(betInfo.betNo_str ? betInfo.betNo_str : null);     //'betNo_str,'  赛车相关
        sqlParam.push(betInfo.betCount_str ? betInfo.betCount_str : null);   //' betCount_str,' 赛车相关
        sqlParam.push(betInfo.win_car_num ? betInfo.win_car_num : null);       //'win_car_num,' 赛车相关
        sqlParam.push(Math.floor(betInfo.betTime.getTime() / 1000));       //时间戳
        sqlParamArr.push(sqlParam)
      //  console.log("par:", sqlParam, "     betInfo.round_id:", betInfo.round_id);

        this.saveBetRecordNew(sqlParamArr)
    }

    public async saveBetRecordNew(sqlParams: any[], sqlParams_robot: any[] = null) {
        let values = []
        sqlParams.forEach(e => values.push(e));
        if (sqlParams_robot)
            sqlParams_robot.forEach(e => values.push(e));
        const task = []
        let i = 1
        for (; i * 100 < values.length; i++) {
            task.push(this._recordDao.insertBetRecord(values.slice((i - 1) * 100, i * 100)))
        }
        task.push(this._recordDao.insertBetRecord(values.slice((i - 1) * 100, values.length)))
        if (task.length > 0) {
            await Promise.all(task)
        }
    }

    // 用户游戏记录入库
    public async saveBetRecord(betInfos: any[], userInfos: any[], roundId: number, robotBetInfos: any[], game_tag: number = 1) {
        let values = []
        if (betInfos.length !== 0) {
            betInfos.forEach(e => {
                let userInfo = userInfos.find(u => u.userId === e.userId)
                let sqlParam = []
                let payOut = 0
                let multiple = 0
                let finishTime = new Date()
                let afterCoin = userInfo.coin
                if (e.cashOut) {
                    payOut = Math.floor(e.betCount * e.multiple / 100)
                    multiple = e.multiple
                    finishTime = e.finishTime
                    afterCoin = e.afterCoin
                }

                sqlParam.push(e.userId)
                sqlParam.push(userInfo.username)
                sqlParam.push(roundId)
                sqlParam.push(e.betCount)
                sqlParam.push(e.auto)
                sqlParam.push(multiple)
                sqlParam.push(payOut)
                sqlParam.push(e.betTime)
                sqlParam.push(finishTime)
                sqlParam.push(e.beforCoin)
                sqlParam.push(afterCoin)
                sqlParam.push(userInfo.expand)
                sqlParam.push(e.tag)
                sqlParam.push(new Date())               //created_at
                sqlParam.push(new Date())               //update_at
                values.push(sqlParam)

            })
        }
        if (robotBetInfos.length !== 0) {
            robotBetInfos.forEach(e => {
                let sqlParam = []
                let payOut = 0
                let multiple = 0
                let finishTime = new Date()
                if (e.cashOut) {
                    payOut = Math.floor(e.betCount * e.multiple / 100)
                    multiple = e.multiple
                    finishTime = e.finishTime
                }
                sqlParam.push(e.userId)
                sqlParam.push(e.username)
                sqlParam.push(roundId)
                sqlParam.push(e.betCount)
                sqlParam.push(e.auto)
                sqlParam.push(multiple)
                sqlParam.push(payOut)
                sqlParam.push(e.betTime)
                sqlParam.push(finishTime)
                sqlParam.push(e.beforCoin)
                sqlParam.push(e.afterCoin)
                sqlParam.push('')
                sqlParam.push(e.tag)
                sqlParam.push(game_tag)
                sqlParam.push(new Date())               //created_at
                sqlParam.push(new Date())               //update_at
                values.push(sqlParam)
            })
        }

        const task = []
        let i = 1
        for (; i * 100 < values.length; i++) {
            task.push(this._recordDao.insertBetRecord(values.slice((i - 1) * 100, i * 100)))
        }
        task.push(this._recordDao.insertBetRecord(values.slice((i - 1) * 100, values.length)))
        if (task.length > 0) {
            await Promise.all(task)
        }
    }

    // 用户游戏记录入库
    public async saveBetRecordOne(betInfo: any, userInfo: any) {
        let values = []
        let sqlParam = []
        sqlParam.push(betInfo.userId)
        sqlParam.push(userInfo.username)
        sqlParam.push(betInfo.index)
        sqlParam.push(betInfo.betCount)
        sqlParam.push(betInfo.auto)
        sqlParam.push(betInfo.multiple * 100)
        sqlParam.push(betInfo.multiple * betInfo.betCount)//betInfo.payout
        sqlParam.push(betInfo.betTime)
        sqlParam.push(new Date())//betInfo.finishTime
        sqlParam.push(betInfo.beforCoin)//下注后余额
        sqlParam.push(betInfo.afterCoin)//派彩余额
        sqlParam.push(userInfo.expand)
        sqlParam.push(userInfo.CoinTag)
        sqlParam.push(userInfo.gameTag)
        sqlParam.push(betInfo.rollUnder)
        sqlParam.push(new Date())               //created_at
        sqlParam.push(new Date())               //update_at


        values.push(sqlParam)

        this._recordDao.insertBetRecordOne(sqlParam)
    }

    // 用户记录入库
    public async saveBetRecordMines(betInfos: any[], userInfos: any[],
        userId: number, sysMapDatas: any[], clickMapDatas: any[]) {

        let userInfo = userInfos.find(u => u.userId === userId)
        let betInfo = betInfos.find(u => u.userId === userId)
        let sysMapData = sysMapDatas.find(u => u.userId === userId)
        let clickMapData = clickMapDatas.find(u => u.userId === userId)

        let sqlParam = []
        let payOut = 0
        let multiple = 0
        let finishTime = new Date()
        let afterCoin = userInfo.coin
        if (betInfo.cashOut) {
            payOut = Math.floor((betInfo.betCount * betInfo.multiple) - betInfo.betCount)
            multiple = betInfo.multiple
            finishTime = betInfo.finishTime
            afterCoin = betInfo.afterCoin
        }
        let sqlParam1 = []
        let diamondNum = 0
        if (betInfo.multiple > 0) {
            for (let i = 0; i < clickMapData.map.length; i++) {
                if (clickMapData.map[i] == 0) { diamondNum++ }
            }
        }

        sqlParam.push(betInfo.userId)
        sqlParam.push(userInfo.username)
        sqlParam.push(betInfo.index)
        sqlParam.push(betInfo.betCount)
        sqlParam.push(betInfo.auto)
        sqlParam.push(multiple * 100)
        sqlParam.push(multiple * betInfo.betCount)
        sqlParam.push(betInfo.betTime)
        sqlParam.push(finishTime)
        sqlParam.push(betInfo.beforCoin)
        sqlParam.push(afterCoin)
        sqlParam.push('2')//这里是游戏标识   1是小飞机  2是扫雷
        sqlParam.push(sysMapData.map.toString())
        sqlParam.push(clickMapData.map.toString())
        sqlParam.push(betInfo.minesNum)
        sqlParam.push(diamondNum)
        sqlParam.push(userInfo.tag)
        sqlParam.push(new Date())               //created_at
        sqlParam.push(new Date())               //update_at


        this._recordDao.insertBetRecordMines(sqlParam)

        try {
            // 游戏记录入库
            this._recordDao.insertGameRecordMines(betInfo.multiple > 0 ? 1 : -1, betInfo.index, betInfo.multiple, betInfo.auto, -1, userInfo.tag, 0)
        } catch (error) {
            console.log(error)
        }

    }

    // 上一局游戏记录
    public async previousRecord(tag?: string) {
        let previousRecord = await this._recordDao.previousRecord(tag)
        let previousRecordResult = previousRecord.results;
        if (previousRecordResult.length == 0) {
            return []
        }
        previousRecordResult.forEach(e => {
            e.username = e.username.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })
        return previousRecordResult;
    }

    //查询最近下注信息(前20条)
    public async cashOutMines() {
        let recordList = await this._recordDao.cashOutMines()
        let userWinResult = recordList.results;
        if (userWinResult.length == 0) {
            return []
        }
        userWinResult.forEach(e => {
            e.userName = e.userName.replace(/(\w{1}).*(\w{1})/, "$1****$2")
        })
        return userWinResult;
    }
}
