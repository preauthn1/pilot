import {FrontendOrBackendSession, HandlerCallback, IHandlerFilter, RouteRecord} from "pinus";

export default function () {
    return new UidFilter()
}

export class UidFilter implements IHandlerFilter{
    before(routeRecord: RouteRecord , msg: any, session: FrontendOrBackendSession, cb: HandlerCallback) {
        if(!session.uid) {
            cb(new Error('not found uid'))
            return
        }
        cb(null)
    }
}
