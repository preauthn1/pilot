import { Application, BackendSession } from 'pinus';
import { Code } from '../../../consts/code';
import { RecordService } from "../../../services/recordService";

export default function (app: Application) {
    return new GameHandler(app);
}

export class GameHandler {
    private _recordService: RecordService;
    constructor(private app: Application) {
        this._recordService = app.get("recordService")
    }


    /**
     * 查询用户游戏记录(最近20条)
     * @param msg
     * @param session
     * @returns
     */
    public async userRecordA(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameRecordInfo = await this._recordService.userRecordA(userId)
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
     * 查询赔付排行(前20条)
     * @param msg
     * @param session
     * @returns
     */

    public async cashOutRankA(msg: { gameTag: number }, session: BackendSession) {
        //获取记录
        const gameRecordInfo = await this._recordService.cashOutRankA(msg.gameTag)
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
   * 查询赔付排行(前20条)
   * @param msg
   * @param session
   * @returns
   */

    public async multipleRankA(msg: { gameTag: number }, session: BackendSession) {
        //获取记录
        const gameRecordInfo = await this._recordService.multipleRankA(msg.gameTag)
        return { code: Code.OK, data: gameRecordInfo }
    }
    public async allBets(msg: { gameTag: number }, session: BackendSession) {
        //获取记录
        const gameRecordInfo = await this._recordService.allBets(msg.gameTag)
        return { code: Code.OK, data: gameRecordInfo }
    }
    public async hightRollers(msg: { gameTag: number }, session: BackendSession) {
        //获取记录
        const gameRecordInfo = await this._recordService.hightRollers(msg.gameTag)
        return { code: Code.OK, data: gameRecordInfo }
    }
    public async rareWins(msg: { gameTag: number }, session: BackendSession) {
        //获取记录
        const gameRecordInfo = await this._recordService.rareWins(msg.gameTag)
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
     * 查询赔付排行(前20条)
     * @param msg
     * @param session
     * @returns
     */

    public async cashOutRank(msg: { tag?: string }, session: BackendSession) {
        //获取记录
        const gameRecordInfo = await this._recordService.cashOutRank(msg.tag)
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
    * 查询赔付排行(前20条)
    * @param msg
    * @param session
    * @returns
    */

    public async cashOutRank_jump(msg: {}, session: BackendSession) {
        //获取记录
        const gameRecordInfo = await this._recordService.cashOutRank_jump()
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
     * 查询赔付排行(前20条)
     * @param msg
     * @param session
     * @returns
     */

    public async cashOutRank_racing(msg: {}, session: BackendSession) {
        //获取记录
        const gameRecordInfo = await this._recordService.cashOutRank_racing()
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
     * 查询赔付排行(前20条)
     * @param msg
     * @param session
     * @returns
     */

    public async cashOutRank_pirate(msg: { onlySelf: boolean, type: string, curr: string }, session: BackendSession) {
        const userId = parseInt(session.uid)
        //获取记录
        const gameRecordInfo = await this._recordService.cashOutRank_pirate(msg, userId);
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
     * 查询倍率排行(前20条)
     * @param msg
     * @param session
     * @returns
     */
    public async multipleRank(msg: { tag?: string }, session: BackendSession) {
        const gameRecordInfo = await this._recordService.multipleRank(msg.tag)
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
     * 查询倍率排行(前20条)
     * @param msg
     * @param session
     * @returns
     */
    public async multipleRank_jump(msg: {}, session: BackendSession) {
        const gameRecordInfo = await this._recordService.multipleRank_jump()
        return { code: Code.OK, data: gameRecordInfo }
    }


    /**
     * 查询用户游戏记录(最近20条)
     * @param msg
     * @param session
     * @returns
     */
    public async userRecord(msg: { tag?: string }, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameRecordInfo = await this._recordService.userRecord(userId, msg.tag)
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
  * 查询用户游戏记录(最近20条)
  * @param msg
  * @param session
  * @returns
  */
    public async findRecordByDate(msg: {channel: string | number, type: number, start: string, end: string, index: number}, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameRecordInfo = await this._recordService.userRecordByDate(userId,msg)
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
   * 查询用户游戏记录(最近20条)
   * @param msg
   * @param session
   * @returns
   */
    public async userGridRecord(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameRecordInfo = await this._recordService.userRecord(userId)
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
    * 查询用户游戏记录(最近20条)
    * @param msg
    * @param session
    * @returns
    */
    public async userRecord_pirate(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameRecordInfo = await this._recordService.userRecord_pirate(userId)
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
     * 查询用户游戏记录(最近20条)
     * @param msg
     * @param session
     * @returns
     */
    public async userRecord_racing(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameRecordInfo = await this._recordService.userRecord_racing(userId)
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
 * 查询用户游戏记录(最近20条)
 * @param msg
 * @param session
 * @returns
 */
    public async userRecord_jump(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        const gameRecordInfo = await this._recordService.userRecord_jump(userId)
        return { code: Code.OK, data: gameRecordInfo }
    }

    /**
     * 查询上一局戏记录
     * @param msg
     * @param session
     * @returns
     */
    public async previousRecord(msg: { tag?: string }, session: BackendSession) {
        const previousRecord = await this._recordService.previousRecord(msg.tag)
        return { code: Code.OK, data: previousRecord }
    }

    /**
     * 查询最近下注信息(前20条)----
     * @param msg
     * @param session
     * @returns
     */

    public async cashOutMines(msg: {}, session: BackendSession) {
        //获取记录
        const gameRecordInfo = await this._recordService.cashOutMines()
        return { code: Code.OK, data: gameRecordInfo }
    }


    public async getAll(msg: {}, session: BackendSession) {
        const userId = parseInt(session.uid)
        const data1 = await this._recordService.userRecordMines(userId)
        const data2 = await this._recordService.cashOutMines()
        const data3 = await this._recordService.multipleRankMines()

        return { code: Code.OK, data: [data1, data2, data3] }
    }

    /** 扫雷最高倍率 */
    public async multipleRankMines(msg: {}, session: BackendSession) {
        const data3 = await this._recordService.multipleRankMines()
        return { code: Code.OK, data: data3 }
    }


}
