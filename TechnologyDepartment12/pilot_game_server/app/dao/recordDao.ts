import { query } from "express";
import { createConnection } from "mysql2";
import { Application } from "pinus"
import { Dao } from "./dao"

export default function (app: Application) {
    return new RecordDao(app)
}

export class RecordDao extends Dao {

    public constructor(app: Application) {
        super(app)
    }


    // 查询用户游戏记录(前20)
    public userRecordA(uid: number) {
        const sql = "SELECT round_id as betId,user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut, created_at AS date,tag,sys_map_data as expand0,expand as expand,click_map_data as expand2  FROM lms_coin_record where user_id = ? ORDER BY created_at DESC LIMIT 21"
        const args = [uid];
        return this.select(sql, args)
    }
    // 查询赔付排行（前20）
    public cashOutRankA(gamTag: number) {
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut,tag,sys_map_data as expand0 ,expand as expand,click_map_data as expand2,finish_time as date FROM lms_coin_record where pay_out > 0 and game_tag= ? and TO_DAYS(created_at) = TO_DAYS(NOW()) ORDER BY pay_out DESC LIMIT 20"
        const args = [gamTag];
        return this.select(sql, args)
    }
    // 查询倍率排行（前20）
    public multipleRankA(gamTag: number) {
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut,tag,sys_map_data as expand0 ,expand as expand,click_map_data as expand2,finish_time as date FROM lms_coin_record where pay_out > 0 and game_tag= ? and TO_DAYS(created_at) = TO_DAYS(NOW()) ORDER BY settlement_multiple DESC LIMIT 20"
        const args = [gamTag];
        return this.select(sql, args)
    }
    public hightRollers(gamTag: number) {
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut,tag,sys_map_data as expand0 ,expand as expand,click_map_data as expand2,finish_time as date FROM lms_coin_record where  game_tag= ?  ORDER BY settlement_multiple DESC LIMIT 20"
        const args = [gamTag];
        return this.select(sql, args)
    }
    public allBets(gamTag: number) {
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut,tag,sys_map_data as expand0 ,expand as expand,click_map_data as expand2,finish_time as date FROM lms_coin_record where  game_tag= ?  ORDER BY settlement_multiple DESC LIMIT 20"
        const args = [gamTag];
        return this.select(sql, args)
    }
    public rareWins(gamTag: number) {
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut,tag,sys_map_data as expand0 ,expand as expand,click_map_data as expand2,finish_time as date FROM lms_coin_record where pay_out > 0 and game_tag= 5 and TO_DAYS(created_at) = TO_DAYS(NOW()) ORDER BY settlement_multiple DESC LIMIT 20"
        const args = [gamTag];
        return this.select(sql, args)
    }

    insertBetRecord_jump(values: any[]) {
        let sql = 'insert into lms_coin_record(user_id, user_name, round_id, bet, bet_type, settlement_multiple, pay_out, bet_time, finish_time, before_coin, after_coin, expand,game_tag,tag,created_at,update_at) values ?'
        return this.insert(sql, [values])
    }

    insertBetRecord_pirate(values: any[]) {
        let sql = 'insert into lms_coin_record(user_id, user_name, round_id, bet, bet_type, settlement_multiple, pay_out, bet_time, finish_time, before_coin, after_coin, expand,game_tag,tag,created_at,update_at) values ?'
        return this.insert(sql, [values])
    }

    insertBetRecord_racing(values: any[]) {
        let sql = 'insert into lms_coin_record(user_id, user_name, round_id, bet, bet_type, settlement_multiple, pay_out, bet_time, finish_time, before_coin, after_coin, expand,betNo_str,betCount_str,game_tag,tag,win_car_num,channel_id,expand_time,created_at,update_at) values ?'

        return this.insert(sql, [values])
    }

    insertBetRecord(values: any[]) {

        let sql = 'insert into lms_coin_record( ' +
            'user_id,' +
            'user_name,' +
            'round_id,' +
            'bet,' +
            'bet_type,' +

            'settlement_multiple,' +
            'pay_out,' +
            'bet_time,' +
            'finish_time,' +
            'before_coin,' +

            'after_coin,' +
            'expand,' +
            'tag,' +
            'game_tag,' +
            'channel_id,' +
            'game_code,' +
            'betNo_str,' +
            'betCount_str,' +
            'win_car_num,' +
            'expand_time,' +
            'created_at,' +
            'update_at' +
            ') values ?'
        
        return this.insert(sql, [values])
    }

    insertBetRecordA(values: any[]) {
        let sql = 'insert into lms_coin_record(user_id, user_name, round_id, bet, bet_type, settlement_multiple, pay_out, bet_time, finish_time, before_coin, after_coin, expand, tag, game_tag, sys_map_data,click_map_data,created_at,update_at) values ( ? )'

        return this.insert(sql, [values])
    }

    insertBetRecordOne(values: any[]) {
        let sql = 'insert into lms_coin_record(user_id, user_name, round_id, bet, bet_type, settlement_multiple, pay_out, bet_time, finish_time, before_coin, after_coin, expand, tag, game_tag, sys_map_data,created_at,update_at) values ( ? )'
        return this.insert(sql, [values])
    }

    // 游戏记录入库
    public insertGameRecord(settlement: number, roundId: number, result: number, endType: number, operator: number, channelID: any, rebate: number = 0, gameCode: string = null) {
        const sql = 'insert into lms_game_record(settlement,round_id, result, rebate, billing_type, operator,channel_id,game_code,created_at) values(?, ?, ?, ?, ?, ?,?,?,?)'
        const args = [settlement, roundId, result, rebate, endType, operator, channelID, gameCode, new Date()]
        return this.insert(sql, args)
    }

    // 游戏记录入库
    public insertGameRecord_jump(settlement: number, roundId: string, result: number, endType: number, operator: number, rebate: number = 0) {
        const sql = 'insert into lms_game_record(round_id,settlement, result, rebate, billing_type, operator,game_tag,created_at) values(?, ?, ?, ?, ?, ?, ?,?)'
        const args = [roundId, settlement, result, rebate, endType, operator, 4, new Date()]
        return this.insert(sql, args)
    }

    // 游戏记录入库
    public insertGameRecord_pirate(settlement: number, roundId: string, result: number, endType: number, operator: number, rebate: number = 0) {
        const sql = 'insert into lms_game_record(round_id,settlement, result, rebate, billing_type, operator,game_tag,created_at) values(?, ?, ?, ?, ?, ?, ?,?)'
        const args = [roundId, settlement, result, rebate, endType, operator, 4, new Date()]
        return this.insert(sql, args)
    }

    // 游戏记录入库
    public insertGameRecord_racing(settlement: number, roundId: number, result: number, endType: number, operator: number, channelID: any, rebate: number = 0) {
        const sql = 'insert into lms_game_record(round_id,settlement, result, rebate, billing_type, operator,game_tag,channel_id,created_at) values(?, ?, ?, ?, ?, ?, ?,?,?)'
        const args = [roundId, 0, 0, rebate, endType, operator, 3, channelID, new Date()]
        return this.insert(sql, args)
    }
    // 游戏记录入库
    public insertGameRecordMines(settlement: number, roundId: number, result: number, endType: number, operator: number, tag: string, rebate: number = 0) {
        const sql = 'insert into lms_game_record(round_id,settlement, result, rebate, billing_type, operator,tag,created_at) values(?, ?, ?, ?, ?, ?, ?,?)'
        const args = [roundId, settlement, result, rebate, endType, operator, tag, new Date()]
        return this.insert(sql, args)
    }

    // 注单记录入库
    insertBetRecordMines(values: any[]) {
        let sql = 'insert into lms_coin_record(user_id, user_name, round_id, bet, bet_type, settlement_multiple, pay_out, bet_time, finish_time, before_coin, after_coin,game_tag,sys_map_data,click_map_data,choose_mines_num,choose_diamonds_num,tag,created_at,update_at) values( ? )'
        return this.insert(sql, [values])
    }

    // 查询赔付排行（前20）
    public cashOutRank(tag?: string) {
        const tagFilter = tag ? " and tag = ?" : ""
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut,tag FROM lms_coin_record where pay_out > 0 and game_tag=1" + tagFilter + " and TO_DAYS(created_at) = TO_DAYS(NOW()) ORDER BY pay_out DESC LIMIT 20"
        const args = tag ? [tag] : [];
        return this.select(sql, args)
    }

    // 查询赔付排行（前20）
    public cashOutRank_jump() {
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut,tag FROM lms_coin_record where pay_out > 0 and game_tag=7 and TO_DAYS(created_at) = TO_DAYS(NOW()) ORDER BY pay_out DESC LIMIT 20"
        const args = [];
        return this.select(sql, args)
    }

    // 查询赔付排行（前20）
    public cashOutRank_racing() {
        const sql = "SELECT user_name AS username, bet AS betCount, pay_out AS cashOut, created_at AS date, tag AS currency FROM lms_coin_record where pay_out > 0 AND game_tag = 3 ORDER BY pay_out DESC LIMIT 15";
        const args = [];
        return this.select(sql, args)
    }

    // 查询赔付排行（前20）
    public cashOutRank_pirate(data: { onlySelf: boolean, type: string, curr: string }, userId) {
        let sql_pir: string;
        let args;
        let order: string;
        if (data.type == 'amount') {
            order = "pay_out";
        } else {
            order = "settlement_multiple";
        }

        if (data.onlySelf) {
            args = [userId];
            sql_pir = 'SELECT user_name AS username, bet AS betCount, settlement_multiple AS result, pay_out AS cashOut, created_at AS date,' +
                'tag FROM lms_coin_record where pay_out > 0 AND user_id = ? AND game_tag = 4 ORDER BY ' + order +
                " DESC LIMIT 15 ";
        } else {
            args = [];
            sql_pir = 'SELECT user_name AS username, bet AS betCount, settlement_multiple AS result, pay_out AS cashOut, created_at AS date,' +
                'tag FROM lms_coin_record where pay_out > 0 AND game_tag = 4 ORDER BY ' + order +
                " DESC LIMIT 15";
        }
        // console.log(sql_pir, args);
        return this.select(sql_pir, args)
    }

    // 查询赔付排行（前20）
    public doubleRank_pirate() {
        const sql_pir = 'SELECT user_name AS username, bet AS betCount, settlement_multiple AS result, pay_out AS cashOut, created_at AS date,tag  FROM lms_coin_record where pay_out > 0 AND game_tag = 4 ORDER BY settlement_multiple DESC LIMIT 15'
        const args = [];
        return this.select(sql_pir, args)
    }

    // 查询倍率排行（前20）
    public multipleRank(tag?: string) {
        const tagFilter = tag ? " and tag = ?" : ""
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut,tag FROM lms_coin_record where settlement_multiple > 0 and game_tag=1" + tagFilter + " and TO_DAYS(created_at) = TO_DAYS(NOW()) ORDER BY settlement_multiple DESC LIMIT 20"
        const args = tag ? [tag] : [];
        return this.select(sql, args)
    }

    // 查询倍率排行（前20）
    public multipleRank_jump() {
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut,tag FROM lms_coin_record where settlement_multiple > 0 and game_tag=7 and TO_DAYS(created_at) = TO_DAYS(NOW()) ORDER BY settlement_multiple DESC LIMIT 20"
        const args = [];
        return this.select(sql, args)
    }

    // 查询倍率排行（前20）
    public multipleRankMines() {
        // const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut FROM lms_coin_record where settlement_multiple > 0 ORDER BY settlement_multiple DESC LIMIT 20"
        let sql = 'SELECT '
            + 'round_id AS `index`,user_name AS userName,update_at AS finishTime,bet AS amount,  pay_out as payout, '
            + 'settlement_multiple AS profit,sys_map_data AS mapData,click_map_data AS clickMapData,tag '
            + 'FROM lms_coin_record '
            + 'where game_tag=2 ORDER BY pay_out desc limit 15 '
        const args = [];
        return this.select(sql, args)
    }
    // 查询用户游戏记录(前20)

    /* 
    SELECT * from lms_coin_record where user_id = 15953 AND DATE_SUB(CURDATE(), INTERVAL 7 DAY) <= date(created_at) ORDER BY created_at desc
    created_at >'2023-9-7' and created_at <'2023-9-9'
    created_at >'2023-9-7' and created_at <'2023-9-9'
    */
    /**
     * @param uid 玩家ID
     * @param type 查询类型  1：查询当天   2：查询过往7天   3：查询指定时间段
     * @param start 开始时间
     * @param end  结束时间
     */
    public userRecordByDate(uid: number, param: { channel: string | number, type: number, start: string, end: string, index: number }) {
        let sql = "SELECT user_name AS username, " +  //用户名
            "bet AS betCount, " +                       //总注额
            "settlement_multiple AS multiple, " +       //结算倍数
            "pay_out AS cashOut, " +                    //赔付额
            "created_at AS date," +                     //时间
            "round_id AS roundId," +                    //订单号
            "after_coin AS coin," +                     //赔付后余额
            "betNo_str AS col," +                       //字段1
            "betCount_str AS coltwo," +                 //字段2
            "win_car_num AS colthree," +                //字段3
            "tag " +                                    //币种
            "FROM lms_coin_record where user_id = ? AND channel_id = ? AND ";
        let sqlfoot: string;
        let sqlEnd: string = "  LIMIT " + (param.index * 20) + ",20";
        let args = [uid, param.channel];
        switch (param.type) {
            case 1:
                //查询当天
                sqlfoot = "DATE_SUB(CURDATE(), INTERVAL " + 0 + " DAY) <= date(created_at) ORDER BY created_at desc";
                break;
            case 2:
                //查询7天
                sqlfoot = "DATE_SUB(CURDATE(), INTERVAL " + 7 + " DAY) <= date(created_at) ORDER BY created_at desc";
                break;
            case 3:
                //按日期查询
                sqlfoot = "created_at > " + param.start + " and created_at < " + param.end;
                break;
        }
        sql += sqlfoot;
        sql += sqlEnd;
        //ORDER BY created_at DESC LIMIT 20"

        return this.select(sql, args)
    }

    public userRecordCountByChanel(uid: number, channel: string | number) {
        const sql = "SELECT " +
            "bet AS betCount, " +                       //总注额
            "settlement_multiple AS multiple, " +       //结算倍数
            "pay_out AS cashOut, " +                    //赔付额
            "betNo_str AS col," +                       //字段1
            "betCount_str AS coltwo," +                 //字段2
            "win_car_num AS colthree " +                //字段3" 
            "FROM lms_coin_record WHERE user_id=? and channel_id=? ORDER BY created_at DESC LIMIT 1"
        const args = [uid, channel];
      //  console.log("sql:",sql);
        
        return this.select(sql, args)
    }

    // 查询用户游戏记录(前20)
    public userRecord(uid: number, tag?: string) {
        const tagFilter = tag ? " AND tag = ?" : ""
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut, created_at AS date,tag  FROM lms_coin_record where user_id = ? AND game_tag = 1" + tagFilter + " ORDER BY created_at DESC LIMIT 20"
        const args = tag ? [uid, tag] : [uid];
        return this.select(sql, args)
    }

    // 查询用户游戏记录(前20)
    public userRecord_pirate(uid: number) {
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS result, pay_out AS cashOut, created_at AS date,tag  FROM lms_coin_record where user_id = ? AND game_tag = 4 ORDER BY created_at DESC LIMIT 15"
        const args = [uid];
        return this.select(sql, args)
    }

    // 查询用户游戏记录(前20)
    public userRecord_racing(uid: number) {
        const sql = "SELECT bet AS betCount, pay_out AS cashOut, created_at AS date, tag AS currency,win_car_num AS winNum FROM lms_coin_record where user_id = ? AND game_tag = 3 ORDER BY created_at DESC LIMIT 15";
        const args = [uid];
        return this.select(sql, args)
    }

    // 查询用户游戏记录(前20)
    public userRecord_jump(uid: number) {
        const sql = "SELECT user_name AS username, bet AS betCount, settlement_multiple AS multiple, pay_out AS cashOut, created_at AS date,tag  FROM lms_coin_record where user_id = ? AND game_tag = 7 ORDER BY created_at DESC LIMIT 20"
        const args = [uid];
        return this.select(sql, args)
    }

    public previousRecord(tag?: string) {
        if (!tag) {
            const sql = "SELECT user_name AS username, bet AS betCount, pay_out as cashOut, settlement_multiple AS multiple,tag FROM lms_coin_record where round_id = (SELECT MAX(round_id) from lms_game_record where game_tag = 1 ) ORDER BY id DESC"
            return this.select(sql, [])
        }
        const sql = "SELECT user_name AS username, bet AS betCount, pay_out as cashOut, settlement_multiple AS multiple,tag FROM lms_coin_record where game_tag = 1 AND tag = ? AND round_id = (SELECT round_id FROM lms_coin_record WHERE game_tag = 1 AND tag = ? ORDER BY id DESC LIMIT 1) ORDER BY id DESC"
        return this.select(sql, [tag, tag])
    }

    // 查询最近下注信息(前20条)
    public cashOutMines() {
        let sql = 'SELECT '
            + 'round_id AS `index`,user_name AS userName,update_at AS finishTime,bet AS amount,  pay_out as payout, '
            + 'settlement_multiple AS profit,sys_map_data AS mapData,click_map_data AS clickMapData,tag '
            + 'FROM lms_coin_record '
            + 'where game_tag=2 ORDER BY finish_time  desc limit 15 '
        const args = [];
        return this.select(sql, args)
    }

    // 查询用户游戏记录(前20)
    public userRecordMines(uid: number) {
        let sql = 'SELECT '
            + 'round_id AS `index`,user_name AS userName,update_at AS finishTime,bet AS amount,  pay_out as payout,   '
            + 'settlement_multiple AS profit,sys_map_data AS mapData,click_map_data AS clickMapData,tag '
            + 'FROM lms_coin_record '
            + 'where user_id=? and game_tag=2 ORDER BY finishTime desc limit 15 '
        const args = [uid];
        return this.select(sql, args)
    }

    public insertPilotChickenCompletedRound(record: { userId: number, username: string, channelId: string | number, gameCode: string, currency: string, roundId: number, betAmount: number, multiplierUnits: number, payoutAmount: number, betTime: Date, finishTime: Date }) {
        const sql = 'INSERT IGNORE INTO lms_coin_record(user_id, user_name, round_id, bet, bet_type, settlement_multiple, pay_out, bet_time, finish_time, before_coin, after_coin, expand, tag, game_tag, channel_id, game_code, created_at, update_at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM lms_coin_record WHERE user_id = ? AND game_code = ? AND round_id = ?)'
        const args = [record.userId, record.username, record.roundId, record.betAmount, 0, record.multiplierUnits, record.payoutAmount, record.betTime, record.finishTime, 0, 0, null, record.currency, 0, record.channelId, record.gameCode, record.finishTime, record.finishTime, record.userId, record.gameCode, record.roundId]
        return this.insert(sql, args)
    }

    public findPilotChickenCompletedRounds(userId: number, gameCode: string, offset: number, limit: number) {
        const sql = 'SELECT finish_time AS gameTime, round_id AS betId, settlement_multiple AS cashOutMultiplierUnits, bet AS betAmount, pay_out AS payoutAmount, tag AS currency FROM lms_coin_record WHERE user_id = ? AND game_code = ? ORDER BY finish_time DESC, id DESC LIMIT ?, ?'
        return this.select(sql, [userId, gameCode, offset, limit])
    }

    public findRecentPilotChickenMultiplierUnits(channelId: string | number, gameCode: string, limit: number) {
        const sql = 'SELECT settlement_multiple AS multiplierUnits FROM lms_coin_record WHERE channel_id = ? AND game_code = ? ORDER BY finish_time DESC, id DESC LIMIT ?'
        return this.select(sql, [channelId, gameCode, limit])
    }

}
