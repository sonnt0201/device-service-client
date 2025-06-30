import { IpcMainInvokeEvent, IpcMainEvent, BrowserWindow } from "electron";
import { IPCControllerBase } from "../base";
import { IObserver } from "../base/IObserver";
import { MainLogger } from "../base/MainLog";
import { RealtimeScreenDSListener } from "../models/RealtimeScreenDSListener";



class RealtimeScreenController extends IPCControllerBase<
    IRealtimeScreenDSClientMessage,
    string
>
    implements IObserver<IRealtimeScreenDSClientMessage> {

    
   private _targetWindow?: BrowserWindow | null; ///< Target window that this controller stream screen & event to.

   private _logger: MainLogger = new MainLogger("RealtimeScreenController")
    
   
   private _dsClient: RealtimeScreenDSListener = RealtimeScreenDSListener.getInstance(); ///< Device Service client

    constructor() {
        super();

        this._dsClient.subcribe(this);

    }

    update(data: IRealtimeScreenDSClientMessage): void {
        if (!this._targetWindow) return;

        // this._logger.log(`RealtimeScreenController received data:`, data);
      

        this._targetWindow.webContents.send(this.channel(), data);

    }

    channel(): string {
        return 'realtime-screen';
    }

    async handle(event: IpcMainInvokeEvent, message: any): Promise<any> {
        // Handle the incoming message and return a response
        return { status: 'success', data: message };
    }

    on(event: IpcMainEvent, message: any): void {
        // Handle the incoming message without a response
        // console.log('RealtimeScreenController received:', message);
    }

    /**
     * Target window that this controller stream screen & event to.
     * 
     * Usually the main window.
     * 
     * @param targetWindow 
     */
    start(): void {

        if (!this._targetWindow) {
            this._logger.error(`Cannot start controller. Target window to stream screens is not binded.
                Call .bindTargetWindow() first.`);
            console.log(this._targetWindow)
            return ;

        }

        this._dsClient.listen(
         
        )

        super.start();
    }

    bindTargetWindow(win: BrowserWindow | null): void {
        this._targetWindow = win;
    }

    removeTargetWindow(): void {
        this._targetWindow = undefined;
    }


}

export const realtimeScreenController = new RealtimeScreenController();