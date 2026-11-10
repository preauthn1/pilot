import { IPlugin } from "pinus";
import { Sync } from "./components/sync";


export default function(): IPlugin {
    return new SyncPlugin()
}

export class SyncPlugin implements IPlugin{
    name = "SyncPlugin";
    components = [Sync];
    // events?: ApplicationEventContructor[];
    // handlerPath?: string;
    // remoterPath?: string;
    // cronPath?: string;
    // beforeStartup?: (app: Application, cb: () => void) => void;
    // afterStartup?: (app: Application, cb: () => void) => void;
    // afterStartAll?: (app: Application) => void;
    // beforeShutdown?: (app: Application, shutDown: () => void, cancelShutDownTimer: () => void) => void;
}