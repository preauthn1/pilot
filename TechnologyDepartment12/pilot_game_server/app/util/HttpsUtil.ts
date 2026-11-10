import { getLogger } from "pinus"
var http = require('http');
let request = require('request');
const logger = getLogger('httpUtil')

export function withOptionalGameCode<T extends object>(postData: T, gameCode?: string): T & { gameCode?: string } {
    const normalizedGameCode = typeof gameCode === 'string' ? gameCode.trim() : ''
    return normalizedGameCode ? { ...postData, gameCode: normalizedGameCode } : postData
}

export function resolveBetGameCode(betGameCode?: string, userGameCode?: string): string {
    const normalizedBetGameCode = typeof betGameCode === 'string' ? betGameCode.trim() : ''
    return normalizedBetGameCode || (typeof userGameCode === 'string' ? userGameCode.trim() : '')
}

/** 单钱包下注 */
export async function bet_danQianBao(username, channelId, amount, refId, host, merchantId, gameCode?: string) {
    // var post_data = {
    //     "username": username,
    //     "channelId": 10014,
    // };//这是需要提交的数据  
    var post_data = withOptionalGameCode({
        username: username,
        channelId: channelId,
        amount: amount,
        refId: refId,
        merchantId: merchantId
    }, gameCode);
    console.log("单钱包下注请求:", post_data, "  host:", host);

    return new Promise<any>((resolve, reject) => {
        let ok = true;
        let dely = setTimeout(() => {
            ok = false;
            clearTimeout(dely);
            reject({ code: 510 });
            console.log("-----------------下注超时----------------");
        }, 4000);

        request.post({
            url: host + '/bet', form: post_data
        }, function (error, response, body) {
            //console.log("error:",error);
            clearTimeout(dely);
            if (!ok) {
                return;
            }

            if (error) {
                reject(error);
                return;
            }
            try {

                let obj = JSON.parse(body);
                // console.log("单钱包下注返回:  data", obj);
                resolve(obj);
            } catch (jsonError) {
                logger.warn('单钱包--下注,数据格式错误:', body, '    error:', jsonError);
                reject(jsonError);
            }
        });
    });
}
/** 单钱包取消下注 */
export async function cancel_danQianBao(username, channelId, refId, amount, host, merchantId, gameCode?: string) {
    // var post_data = {
    //     "username": username,
    //     "channelId": 10014,
    // };//这是需要提交的数据  
    var post_data = withOptionalGameCode({
        username: username,
        channelId: channelId,
        refId: refId,
        amount: amount,
        merchantId: merchantId
    }, gameCode);

    console.log('单钱包取消下注,post_data:', post_data, +  "host", host + '/unbet')

    return new Promise<any>((resolve, reject) => {
        request.post({
            url: host + '/unbet', form: post_data
        }, function (error, response, body) {
            //console.log("error:",error);
            if (error) {
                reject(error);
                return;
            }
            try {
                let obj = JSON.parse(body);
                console.log('单钱包取消下注成功:', obj);
                resolve(obj);
            } catch (jsonError) {
                logger.warn('单钱包--取消下注,数据格式错误:', body, '    error:', jsonError);
                reject(jsonError);
            }
        });
    });
}

/** 单钱包派彩 */
export async function settle_danQianBao(username, channelId, refId, rewardAmount:number, host, merchantId, gameCode?: string) {
    // var post_data = {
    //     "username": username,
    //     "channelId": 10014,
    // };//这是需要提交的数据  
    //0.9265
    //92.65    0.93    100   100.00
    var post_data = withOptionalGameCode({
        username: username,
        channelId: channelId,
        rewardAmount: rewardAmount.toFixed(0),
        refId: refId,
        merchantId: merchantId
    }, gameCode);
    console.log("单钱包派彩请求:", host + '/settle', post_data);

    function settle() {
        return new Promise<any>((resolve, reject) => {
            request.post({
                url: host + '/settle', form: post_data
            }, function (error, response, body) {

                if (error) {
                    //console.log("单钱包派彩错误error:", error);
                    reject(error);
                    return;
                }
                //  console.log("response:",response);
                // console.log("bpdy Type:",typeof body);        
                //console.log("resolve:", body)

                let isJson: boolean = true;
                let obj;
                try {
                    obj = JSON.parse(body)
                } catch (jsonError) {
                    logger.warn('单钱包派彩返回,数据格式错误:', body, '    error:', jsonError);
                    isJson = false;
                    //  reject(jsonError);
                }
                if (isJson) {
                    resolve(obj);
                } else {
                    reject({ code: 510, msg: '单钱包请求,接收到返回数据不是json格式' });
                }
            });
        });
    }
    //let retuData;

    //return retuData;
    let startTime = new Date();
    let success: boolean = false;
    let count = 1;
    do {
        let nowTime = new Date();
        let len = nowTime.getTime() - startTime.getTime();
        if (len >= 120000 || count > 100) {
            return { code: 500, msg: '访问结算超时---2min' };
        }
        let retuData;
        await settle()
            .then((e) => {
                retuData = e;
            })
            .catch((e) => {
                retuData = e;
            });

        count++;
        //console.log("retuData:", count, "    data:", retuData);

        if (retuData.code != 0) {
            console.log("单钱包派彩返回错误:", retuData);
            success = false;
        } else {
            success = true;
            console.log("单钱包派彩返回:", retuData);
            return retuData;
        }

    } while (!success);

    // return new Promise<any>((resolve, reject) => {
    //     request.post({
    //         url: host + '/settle', form: post_data
    //     }, function (error, response, body) {

    //         if (error) {
    //             console.log("单钱包派彩错误error:", error);
    //             reject(error);
    //             return;
    //         }
    //         //  console.log("response:",response);
    //         // console.log("bpdy Type:",typeof body);        
    //         console.log( "resolve:",body)
    //         try {
    //             let obj = JSON.parse(body);
    //             resolve(obj);
    //         } catch (jsonError) {
    //             logger.warn('单钱包派彩返回,数据格式错误:', body, '    error:', jsonError);
    //             reject(jsonError);
    //         }

    //     });
    // });
}

export async function getBalanceNew(username, channelId, host, merchantId, gameCode?: string) {
    var post_data = {
        "username": username,
        "channelId": channelId,
        "merchantId": merchantId,
        ...withOptionalGameCode({}, gameCode)
    }; //这是需要提交的数据  
    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>post_data<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",host + '/getBalance');
    console.log('单钱包获取数据,host:', host + '/getBalance     data:', post_data)
    return new Promise<any>((resolve, reject) => {

        // var request = require('request');
        // var url = host + '/getBalance';
        // var requestData = post_data;
        // request({
        //     url: url,
        //     method: "POST",
        //     json: true,
        //     headers: {
        //         "content-type": "application/json",
        //     },
        //     body: JSON.stringify(requestData)
        // }, function (error, response, body) {
        //     if (!error && response.statusCode == 200) {
        //         try {
        //             let obj = JSON.parse(body);
        //             console.log("单钱包获取数据,data:", obj);
    
        //             resolve(obj);
        //         } catch (jsonError) {
        //             logger.warn('单钱包获取用户余额,数据格式错误:', body, '    error:', jsonError);
        //             reject(jsonError);
        //         }
        //     }else{
        //         console.log("error:", error);
        //         reject(error);
        //     }
        // });


        request.post({
            url: host + '/getBalance', form: post_data
        }, function (error, response, body) {

            if (error) {
                console.log("error:", error);
                reject(error);
                return;
            }
            //  console.log("response:",response);
            // console.log("bpdy Type:",typeof body);        
            //console.log( "resolve:",body)
            try {
                let obj = JSON.parse(body);
                console.log("单钱包获取数据,data:", obj);

                resolve(obj);
            } catch (jsonError) {
                logger.warn('单钱包获取用户余额,数据格式错误:', body, '    error:', jsonError);
                reject(jsonError);
            }
        });
    });
}

/** 免费下注 - 扣减次数（游戏服调用 Java 内部接口） */
/** Free bet - query the authoritative remaining count from Java during game entry. */
export async function freeBetRemain(userId: number, channelId: number, host: string, gameCode?: string) {
    const postData = withOptionalGameCode({ userId, channelId }, gameCode)
    return new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject({ code: 510 }), 4000)
        request.post({
            url: host + '/freeBet/internal/remain', form: postData
        }, function (error, response, body) {
            clearTimeout(timeout)
            if (error) { reject(error); return }
            try {
                resolve(JSON.parse(body))
            } catch (jsonError) {
                logger.warn('Free-bet remaining-count response is invalid:', body, '    error:', jsonError)
                reject(jsonError)
            }
        })
    })
}

export async function freeBetUse(userId: number, channelId: number, roundId: string, host: string, gameCode?: string) {
    var post_data = withOptionalGameCode({
        userId: userId,
        channelId: channelId,
        roundId: roundId,
    }, gameCode);
    console.log("免费下注扣减请求:", post_data, "  host:", host);

    return new Promise<any>((resolve, reject) => {
        let ok = true;
        let dely = setTimeout(() => {
            ok = false;
            clearTimeout(dely);
            reject({ code: 510 });
        }, 4000);

        request.post({
            url: host + '/freeBet/use', form: post_data
        }, function (error, response, body) {
            clearTimeout(dely);
            if (!ok) return;
            if (error) { reject(error); return; }
            try {
                let obj = JSON.parse(body);
                resolve(obj);
            } catch (jsonError) {
                logger.warn('免费下注扣减,数据格式错误:', body, '    error:', jsonError);
                reject(jsonError);
            }
        });
    });
}

/** 免费下注 - 恢复次数（取消下注时调用） */
export async function freeBetRecover(userId: number, channelId: number, roundId: string, host: string) {
    var post_data = {
        userId: userId,
        channelId: channelId,
        roundId: roundId,
    };
    console.log("免费下注恢复请求:", post_data, "  host:", host);

    return new Promise<any>((resolve, reject) => {
        let ok = true;
        let dely = setTimeout(() => {
            ok = false;
            clearTimeout(dely);
            reject({ code: 510 });
        }, 4000);

        request.post({
            url: host + '/freeBet/recover', form: post_data
        }, function (error, response, body) {
            clearTimeout(dely);
            if (!ok) return;
            if (error) { reject(error); return; }
            try {
                let obj = JSON.parse(body);
                resolve(obj);
            } catch (jsonError) {
                logger.warn('免费下注恢复,数据格式错误:', body, '    error:', jsonError);
                reject(jsonError);
            }
        });
    });
}
