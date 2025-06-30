/**
 * @file Base module to provide interfaces for Electron main process. 
 * 
 * No-Dependency module.
 * 
 * Must include interface, abstract class and type only for other module (models or controllers) to implement or use.
 */

export type {IIPCController} from './IIPCController';
export  {IPCControllerBase} from './IPCControllerBase';
