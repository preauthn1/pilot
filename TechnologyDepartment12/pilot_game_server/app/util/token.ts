import * as crypto from "crypto";

export interface AuthInfo {
    uid: string
    timeKey: number
    gameCode: string
    isLegacy: boolean
}

export class Token {
    // public static create(uid : string): string {
    //     const text = Date.now() + "|" + uid + "|" + Math.floor(Math.random() * 10000)
    //     let iv = crypto.randomBytes(IV_LENGTH);
    //     let cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(TOKEN_PWD, 'base64'), iv);
    //     let encrypted:Buffer = cipher.update(Buffer.from(text));
    //     encrypted = Buffer.concat([encrypted, cipher.final()]);
    //     return iv.toString('hex') + ':' + encrypted.toString('hex');
    // }

    public static parse(token: unknown, key: string): AuthInfo | null {
        try {
            if (typeof token !== 'string') return null
            if (typeof key !== 'string' || key.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(key)) return null
            const secret = Buffer.from(key, 'base64')
            if (secret.length !== 32 || secret.toString('base64') !== key) return null

            const parts = token.split(':')
            let ivHex: string
            let cipherHex: string
            let isLegacy: boolean
            if (parts[0] === 'v2') {
                if (parts.length !== 4 || !isHex(parts[1], 32) || !isEvenHex(parts[2]) || !isHex(parts[3], 64)) return null
                const signed = parts.slice(0, 3).join(':')
                const macKey = crypto.createHash('sha256')
                    .update(Buffer.from('pilot-token-mac', 'utf8')).update(secret).digest()
                const expected = crypto.createHmac('sha256', macKey).update(signed, 'ascii').digest()
                const actual = Buffer.from(parts[3], 'hex')
                if (!crypto.timingSafeEqual(expected, actual)) return null
                ivHex = parts[1]
                cipherHex = parts[2]
                isLegacy = false
            } else {
                if (parts.length !== 2 || !isHex(parts[0], 32) || !isEvenHex(parts[1])) return null
                ivHex = parts[0]
                cipherHex = parts[1]
                isLegacy = true
            }

            const decipher = crypto.createDecipheriv('aes-256-ctr', secret, Buffer.from(ivHex, 'hex'))
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(cipherHex, 'hex')),
                decipher.final()
            ])
            const result = decrypted.toString('utf8').split('|')
            if ((isLegacy && result.length !== 3) || (!isLegacy && result.length !== 4)) {
                return null
            }
            const timeKey = Number(result[0])
            if (!Number.isFinite(timeKey) || !result[1]) return null
            return {
                uid: result[1],
                timeKey,
                gameCode: isLegacy ? '' : normalizeGameCode(result[3]),
                isLegacy
            }
        } catch (_) {
            return null;
        }
    }

    public static check(authInfo: { uid: string, timeKey: number }, useful: number) {
        if (!authInfo || !authInfo.timeKey || !authInfo.uid) {
            return false;
        }
        let nowTime = Date.now();
        return ((nowTime - authInfo.timeKey) < useful);
    }

}

function isHex(value: string, length: number): boolean {
    return value.length === length && /^[0-9a-f]+$/i.test(value)
}

function isEvenHex(value: string): boolean {
    return value.length > 0 && value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value)
}

function normalizeGameCode(gameCode?: string): string {
    return typeof gameCode === 'string' ? gameCode.trim().toLowerCase() : ''
}

export function resolveTrustedGameCode(authCode: string, messageCode: string | undefined, isLegacy: boolean): string | null {
    if (isLegacy) {
        return ''
    }
    const trustedCode = normalizeGameCode(authCode)
    const requestedCode = normalizeGameCode(messageCode)
    return requestedCode && requestedCode !== trustedCode ? null : trustedCode
}
