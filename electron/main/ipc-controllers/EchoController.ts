import { IPCControllerBase } from "../base";
import { IpcMainInvokeEvent, IpcMainEvent } from "electron";

/**
 * Echo controller for testing purpose
 */
class EchoController extends IPCControllerBase<string, string> {
    channel(): string {
        return 'echo';
    }

 async handle(event: IpcMainInvokeEvent, message: string): Promise<string> {
     return `[Echo]: ${message}`;
 }

 on(event: IpcMainEvent, message: string): void {
     
 }
  
}

export const echoController = new EchoController();
