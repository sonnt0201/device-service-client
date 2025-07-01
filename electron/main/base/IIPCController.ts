/**
 * No-Dependency
 * 
 * Interface for a controller that handles a single type of event from Electron IPC (Inter-Process Communication).
 */
export interface IIPCController<
TIncomingMessage,
TOutgoingMessage
> {
    channel(): string;
  
    handle?(event: Electron.IpcMainInvokeEvent, message: TIncomingMessage): Promise<TOutgoingMessage>;
    on?(event: Electron.IpcMainEvent, message: TIncomingMessage) : void;
    
    /** Start listening for incoming IPC messages from the defined channel. */
    start(): void;
}
