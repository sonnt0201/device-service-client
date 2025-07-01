import { ISetRelayMsg } from "electron/ipc-shared/ISetRelayMsg";
import { IPCControllerBase } from "../base";
import { IReportRelayMsg } from "electron/ipc-shared/IReportRelayMsg";
import { IObserver } from "../base/IObserver";
import { IEventMsg } from "electron/ipc-shared/IEventMsg";
import { BrowserWindow } from "electron/main";
import { EventExchangeDSListener } from "../models/EventExchangeDSListener";
import { IObservable } from "../base/IObservable";
import { webContents } from "electron";
import { IMainLogger } from "../base/IMainLog";
import { MainLogger } from "../base/MainLog";
import { MsgTypeValue } from "../../ipc-shared/MessageType";

class RelayController extends IPCControllerBase<
    ISetRelayMsg,
    IReportRelayMsg
>
    implements IObserver<IEventMsg> {
    private _targetWindow: BrowserWindow | null = null

    // private _dsEventListener: EventExchangeDSListener = EventExchangeDSListener.getInstance();
    private _logger: IMainLogger = new MainLogger("RelayController")
    constructor() {
        super();

        EventExchangeDSListener
            .getInstance()
            .eventMsgNotifier
            .subcribe(this); //observer pattern subcribe 
    }

    update(data: IEventMsg): void {

        if (this._targetWindow) {

            /// GUARD if report relay message 
            if (data.content.message_type !== MsgTypeValue.REPORT_RELAY) return;

            this._targetWindow.webContents.send(this.channel(), data.content as ISetRelayMsg);
        }

    }



    channel(): string {
        return "relay"
    }


    on(event: Electron.CrossProcessExports.IpcMainEvent, message: ISetRelayMsg): void {

        if (!EventExchangeDSListener.getInstance().startListening) return;

            /// msg to send to device service
         const  messageToSendDS: IEventMsg = {
             id: message.message_id,
             content: message
         };

        EventExchangeDSListener
            .getInstance()
            .send(JSON.stringify(messageToSendDS));
    }

    bindTargetWindow(win: BrowserWindow | null): RelayController {
        this._targetWindow = win;

        return this;

    }

    removeTargetWindow(): RelayController {
        this._targetWindow = null;

        return this;
    }

    start(): void {

        // GUARD
        if (!this._targetWindow) {
            this._logger.error(`Cannot start controller. Target window to stream screens is not binded.
                Call .bindTargetWindow() first.`);
            return;

        }


        super.start();
    }

}

export const relaycontroller = new RelayController();