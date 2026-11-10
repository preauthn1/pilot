import * as crc from 'crc';

export function dispatch<T>(uid: string , connectors: T[]): T {
    let index = Math.abs(crc.crc32(uid)) % connectors.length;
    return connectors[index];
}