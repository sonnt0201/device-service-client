import { BrowserWindow } from "electron";
import { IPCControllerBase } from "../base"
import { MainLogger } from "../base/MainLog";
import { IMainLogger } from "../base/IMainLog";
import { IObserver } from "../base/IObserver";
import { EventExchangeDSListener } from "../models/EventExchangeDSListener";
import { IEventMsg } from "../../ipc-shared/IEventMsg";
import { MsgTypeValue } from "../../ipc-shared/IHasMsgType";
import { IEncodedLog } from "electron/ipc-shared/Log";
import { ISimpleORM } from "../base/ISimpleORM";
// import { LogSQLiteORM } from "../models/LogSQLiteORM";
import { ISimpleSyncORM } from "../base/ISimpleSyncORM";
import { LogBetterSQLiteORM } from "../models/LogBetterSQLiteORM";


class LogEventController extends IPCControllerBase
    implements IObserver<IEventMsg>
{

    constructor() {
        super();
        this._eventExchangeDSListener.eventMsgNotifier.subcribe(this);
    }

    private _targetWindow?: BrowserWindow | null; ///< Target window that this controller streams screen & event to.
    private _logger: IMainLogger = new MainLogger("LogEventController");
    private _eventExchangeDSListener: EventExchangeDSListener = EventExchangeDSListener.getInstance(); ///< Device Service client for event exchange.
    private _logsORM: ISimpleSyncORM<IEncodedLog> = new LogBetterSQLiteORM();
    
    channel(): string {
        return "logi-log-event";
    }

    start(): void {
        if (!this._targetWindow) {
            this._logger.error("No target window bound. Cannot start LogEventController.");
            return;
        }
        this._logger.log("LogEventController started.");

        
        this._eventExchangeDSListener.listen();

        super.start();
    }

    bindTargetWindow(targetWindow: BrowserWindow): LogEventController {
        this._targetWindow = targetWindow;
        this._logger.log(`Target window bound: ${targetWindow.id}`);

        return this;
    }

    removeTargetWindow(): LogEventController {
        if (this._targetWindow) {
            this._logger.log(`Removing target window: ${this._targetWindow.id}`);
            this._targetWindow = null;
        } else {
            this._logger.warn("No target window to remove.");
        }

        return this;
    }

    update(data: IEventMsg): void {
        if (!this._targetWindow) {
            this._logger.warn("No target window to send event data.");
            return;
        }

        /// Message type filter
        if ( data.content.message_type !== MsgTypeValue.LOG_SUBLOG) {
            this._logger.warn(`Received message with unsupported type: ${data.content}`);
            return;
        }

        this._logger.log(`Sending event data to window ${this._targetWindow.id}`);

        this._logsORM.create(data.content as IEncodedLog);

        this._targetWindow.webContents.send(this.channel(), data.content as IEncodedLog);
    }
}

export const logEventController = new LogEventController();