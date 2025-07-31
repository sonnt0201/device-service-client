import { IIPCController } from "./IIPCController";
import { ipcMain, IpcMainInvokeEvent, IpcMainEvent } from "electron";

/**
 * Dependencies: {@link IIPCController}
 * 
 * Generic base class for IPC controllers in Electron.
 * 
 * Implement to make an IPC Controller object listening in returned channel name in channel method.
 * 
 * After defined, start() it in main/index.ts
 * 
 * Then, declared ipc interface functions it provides in @ref preload/index.ts & @ref Window object in electron-env.d.ts
 * 
 * TIncoming - Type of the message received from the renderer process (for both `handle` and `on`).
 * TOutgoing - Type of the message returned from `handle()` back to the renderer.
 */
export abstract class IPCControllerBase<
    TIncoming ,
    TOutgoing 
> implements IIPCController<TIncoming, TOutgoing> {

    
    protected _isStarted: boolean = false;

    abstract channel(): string;
  
       /**
     * Implement this method in your subclass to handle messages sent from the renderer
     * using `ipcRenderer.invoke(channel, message)`.
     *
     * If this method is defined, the base class will automatically register `ipcMain.handle(...)`
     * on the provided `channel()`. 
     *
     * This is used for **request-response** style messaging.
     *
     * @param event - The invoke event.
     * @param message - The payload sent from the renderer.
     * @returns A Promise resolving to a response that will be sent back to the renderer.
     */
     handle?(event: IpcMainInvokeEvent, message: TIncoming): Promise<TOutgoing>;

      /**
     * Implement this method in your subclass to handle messages that main-process receives from the renderer
     * using `ipcRenderer.send(channel, message)`.
     *
     * If this method is defined, the base class will automatically register `ipcMain.on(...)`
     * on the provided `channel()` when `start()` method is called. 
     *
     * This is used for **fire-and-forget** style messaging.
     *
     * @param event - The event emitted by the renderer.
     * @param message - The payload sent from the renderer.
     */
     on?(event: IpcMainEvent, message: TIncoming): void;

    /**
     * Send a typed message from the main process to the renderer.
     * @param event - The IPC event to respond to.
     * @param message - The message payload to send.
     */
    send(event: IpcMainEvent, message: TOutgoing): void {
        event.sender.send(this.channel(), message);
    }



    /**
     * Register IPC listeners for both `invoke` and `on` mechanisms.
     */
    start(): void {
        if (this._isStarted) return ;

        this._isStarted = true;
        this._defaultStart();
    }

    /**
     * Must not override this method.
     * This is the default implementation that registers the IPC channel.
     */
    private _defaultStart(): void {
        const channelName = this.channel();

        if (channelName) {

            const { handle, on } = this;

            handle && ipcMain.handle(channelName, (event, message: TIncoming) => {
                return handle!(event, message);
            });


            on && ipcMain.on(channelName, (event, message: TIncoming) => {
                on!(event, message);
            });
        }
    }
}
