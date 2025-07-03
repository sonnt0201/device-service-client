import { IPCControllerBase } from "./IPCControllerBase"
import { BrowserWindow, ipcMain } from "electron"

import { IMainLogger } from "./IMainLog";

/**
 * Dependencies: {@link IPCControllerBase}
 * 
 * Version 2 as an extension of {@link IPCControllerBase} that supports:
 * 
 * - Binding a target {@link BrowserWindow} for sending IPC messages.
 * - Logging operations using {@link IMainLogger}.
 * 
 * @template TIncoming Type of messages received from renderer.
 * @template TOutgoing Type of messages sent back to renderer.
 */
export abstract class IPCControllerBaseV2<
    TIncoming,
    TOutgoing
> extends IPCControllerBase<
    TIncoming,
    TOutgoing
> {

    constructor() {
        super()
    }

    /**
     * Target window that this controller sends IPC messages to.
     */
    protected _targetWindow?: BrowserWindow | null; ///< Target window that this controller streams screen & event to.

    /**
    * Logger utility implementing {@link IMainLogger}.
    */
    abstract _logger: IMainLogger | undefined 

    /**
     * Send IPC message to bound target window (bound using {@link bindTargetWindow})
     */
    sendMsgToTargetWindow(msg: TOutgoing) {
        if (this._targetWindow) this._targetWindow.webContents.send(this.channel(), msg);

    }

    /**
    * Binds a target window to this controller for sending messages.
    * Logs the binding event.
    * 
    * @param targetWindow - The BrowserWindow instance to bind.
    * @returns This controller instance for chaining.
    */
    bindTargetWindow(targetWindow: BrowserWindow): IPCControllerBaseV2<TIncoming, TOutgoing> {
        this._targetWindow = targetWindow;
        if (this._logger) this._logger.log(`Target window bound: ${targetWindow.id}`);

        return this;
    }

    /**
    * Removes the currently bound target window.
    * Logs the removal event or warns if no window was bound.
    * 
    * @returns This controller instance for chaining.
    */
    removeTargetWindow(): IPCControllerBaseV2<TIncoming, TOutgoing> {
        if (this._targetWindow) {
            if (this._logger) this._logger.log(`Removing target window: ${this._targetWindow.id}`);
            this._targetWindow = null;
        } else {
            if (this._logger) this._logger.warn("No target window to remove.");
        }

        return this;
    }

    /**
    * Starts the controller.
    * 
    * Checks if a target window is bound before starting. Logs errors if not bound.
    * Calls the parent class's start method if all preconditions are met.
    */
    override start(): void {
        if (!this._targetWindow) {
            if (this._logger) this._logger.error("No target window bound. Cannot start controller.");
            return;
        }

        if (this._isStarted) return;

        this._isStarted = true;

        const channelName = this.channel();

        if (channelName) {
            const { handle, on } = this;

            if (handle) {
                ipcMain.handle(channelName, (event, message) => {
                    // Call handle via instance to preserve 'this'
                    return this.handle!(event, message);
                });
            }

            if (on) {
                ipcMain.on(channelName, (event, message) => {
                    // Call on via instance to preserve 'this'
                    this.on!(event, message);
                });
            }
        }

        if (this._logger) this._logger.log("ControllerV2 started.");
    }

}