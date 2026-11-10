import {Application} from "pinus";
import {Pool, PoolConnection} from "mysql2";
import { reject, resolve } from "bluebird";
import Bluebird = require("bluebird");

/** mysql query result field descriptor (compatible with mysql & mysql2) */
export type DbFieldInfo = any;
/** mysql error (compatible with mysql & mysql2) */
export type DbError = any;

export class Dao {
    protected pool: Pool
    protected insert = this.query
    protected delete = this.query
    protected update = this.query
    protected select = this.query

    public constructor(protected app: Application) {
        this.pool = app.get('MysqlPool')
    }

    private async query(sql: string, args: any[], connection?: PoolConnection) {
        return new Promise<{results?: any, fields?: DbFieldInfo[]}>((resolve, reject) => {
            const _connection = connection ? connection : this.pool
            _connection.query(sql, args, (err: DbError | null, results?: any, fields?: DbFieldInfo[]) => {
                if (err) {
                    reject(err)
                }
                resolve({results, fields})
            })
        })
    }
    protected async getConnection(): Promise<PoolConnection> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err: DbError, connection: PoolConnection) => {
                if(!!err) {
                    reject(err)
                } else {
                    resolve(connection)
                }
            })
        })
    }

    protected async beginTransaction(connection: PoolConnection) {
        return new Promise<void>((resolve, reject) => {
            connection.beginTransaction((err: any) => {
                if(err) reject(err)
                else resolve()
            })
        })
    }

    protected async rollback(connection: PoolConnection) {
        return new Promise<void>((resolve, reject) => {
            connection.rollback(() => { resolve() })
        })
    }

    protected async commit(connection: PoolConnection) {
        return new Promise<void>((resolve, reject) => {
            connection.commit((err: any) => {
                if(err) reject(err)
                else resolve()
            })
        })
    }
}
