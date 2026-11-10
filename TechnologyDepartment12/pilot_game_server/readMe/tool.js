const crypto = require("crypto");
function makeToken() {
    const bytes = crypto.randomBytes(32)
    return bytes.toString('base64')
}

function makeKey() {
    const bytes = crypto.randomBytes(8)
    return bytes.toString('hex')
}

function parse(token, key){
    let textParts = token.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(key, 'base64'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const result = decrypted.toString().split('|');
    if (result.length !== 3) {
        return null;
    }
    return {uid: result[1], timeKey: Number(result[0])}
}

function smooth(result) {
    const point = []
    let value = 99
    let acceleration = 1        //加速度
    let speed = 1               //速度
    let times = 0
    for (;;) {
        times += 1
        value += speed
        if(result <= value) {
            point.push(result)
            break
        }
        point.push(value)
        if (times % 20 === 0) {
            speed += acceleration
        }
        if (times % 180 === 0) {
            acceleration *= 10
        }
    }
    return point
}

console.log(smooth(202))

// console.log(parse('65d0f03daf4422e056f10b9b3db344a5:352cdfb85ed80c2b796668101f93c01a7a948ee44c', 'cP3hsLrfN0l7QOdO4ETgzqLYc6ly69jjbCQIHMJ4cxc='))
// const str = '65d0f03daf4422e056f10b9b3db344a5'
// console.log(makeToken())
// console.log(makeKey())
// https.get[util.promisify.custom] = function (url) {
//     return new Promise((resolve, reject) => {
//         https.get(url, (res) => {
//             res.statusCode === 200 ? resolve(res.statusMessage) : reject(res.statusMessage)
//         })
//     })
// }
// const aget = util.promisify(https.get)
// aget("https://skin_api.24hmatchwin.com/flyer_game/flyer_balance" + '?' + 'username='+ 'yyp').then(e => {
//     console.log(e)
// }).catch(err => {
//     console.warn()
// })

