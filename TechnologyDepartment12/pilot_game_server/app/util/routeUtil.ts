
import { dispatch } from './dispatcher';
import { Session, Application } from 'pinus';

export function aviator(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

    let aviatorServers = app.getServersByType('aviator');
    if (!aviatorServers || aviatorServers.length === 0) {
        cb(new Error('can not find aviator servers.'));
        return;
    }
    cb(null, aviatorServers[0].id)
}

export function pilotChicken(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

    let pilotChickenServers = app.getServersByType('pilotChicken');
    if (!pilotChickenServers || pilotChickenServers.length === 0) {
        cb(new Error('can not find pilotChicken servers.'));
        return;
    }
    cb(null, pilotChickenServers[0].id)
}

export function mines(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

    let minesServers = app.getServersByType('mines');
    if (!minesServers || minesServers.length === 0) {
        cb(new Error('can not find mines servers.'));
        return;
    }
    cb(null, minesServers[0].id)
}


export function dice(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

    let diceServers = app.getServersByType('dice');
    if (!diceServers || diceServers.length === 0) {
        cb(new Error('can not find dice servers.'));
        return;
    }
    cb(null, diceServers[0].id)
}


export function racing(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

    let racingServers = app.getServersByType('racing');
    if (!racingServers || racingServers.length === 0) {
        cb(new Error('can not find racingServers servers.'));
        return;
    }
    cb(null, racingServers[0].id)
}

export function pirate(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

    let pirateServers = app.getServersByType('pirate');
    if (!pirateServers || pirateServers.length === 0) {
        cb(new Error('can not find pirateServers servers.'));
        return;
    }
    cb(null, pirateServers[0].id)
}

export function tiger(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

    let tigerServers = app.getServersByType('tiger');
    if (!tigerServers || tigerServers.length === 0) {
        cb(new Error('can not find tigerServers servers.'));
        return;
    }
    cb(null, tigerServers[0].id)
}

export function jump(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

    let jumpServers = app.getServersByType('jump');
    if (!jumpServers || jumpServers.length === 0) {
        cb(new Error('can not find jumpServers servers.'));
        return;
    }
    cb(null, jumpServers[0].id)
}

export function triple(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

    let tripleServers = app.getServersByType('triple');
    if (!tripleServers || tripleServers.length === 0) {
        cb(new Error('can not find tripleServers servers.'));
        return;
    }
    cb(null, tripleServers[0].id)
}

export function clearMines(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

    let clearMines = app.getServersByType('clearMines');
    if (!clearMines || clearMines.length === 0) {
        cb(new Error('can not find clearMinesServers servers.'));
        return;
    }
    cb(null, clearMines[0].id)
}

export function superAce(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

    let aceServers = app.getServersByType('superAce');
    if (!aceServers || aceServers.length === 0) {
        cb(new Error('can not find ACEServers servers.'));
        return;
    }
    cb(null, aceServers[0].id)
}


export function hall(session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {
    let hallServers = app.getServersByType('hall')
    if (!hallServers || hallServers.length === 0) {
        cb(new Error('can not find hall servers.'))
        return
    }
    let res = dispatch(session.uid, hallServers)
    cb(null, res.id)
}
