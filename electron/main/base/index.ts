/**
 * @deprecated Compatibility shim. The shared kernel moved to `electron/main/shared`.
 * Kept so not-yet-migrated controllers keep compiling during the DDD migration.
 * Remove once every context imports from `../shared` directly.
 */
export type { IIPCController } from '../shared/ipc/IIPCController';
export { IPCControllerBase } from '../shared/ipc/IPCControllerBase';
