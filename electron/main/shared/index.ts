/**
 * @file Shared kernel for the Electron main process.
 *
 * Framework primitives only — no domain, no Device-Service knowledge.
 * Contexts import IPC bases, the logger, the observer bus and ORM interfaces from here.
 */

export type { IIPCController } from './ipc/IIPCController';
export { IPCControllerBase } from './ipc/IPCControllerBase';
export { IPCControllerBaseV2 } from './ipc/IPCControllerBaseV2';

export type { IMainLogger } from './logging/IMainLog';
export { MainLogger } from './logging/MainLog';

export type { IObservable } from './events/IObservable';
export type { IObserver } from './events/IObserver';
export { Observable } from './events/Observable';

export type { ISimpleORM } from './persistence/ISimpleORM';
export type { ISimpleSyncORM } from './persistence/ISimpleSyncORM';
