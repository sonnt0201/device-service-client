import { IORMTimestampFilter } from "@/ipc-shared/IORMTimestampFilter";
import { IPCControllerBase } from "../base";
import { IEncodedLog } from "@/ipc-shared/Log";

import { ISimpleSyncORM } from "../base/ISimpleSyncORM";
import { LogBetterSQLiteORM } from "../models/LogBetterSQLiteORM";

/**
 * A middleware between Renderer and Main::ORM to read logs
 */
class LogController extends IPCControllerBase<IORMTimestampFilter, IEncodedLog[]> {

    private _orm: LogBetterSQLiteORM = LogBetterSQLiteORM.getInstance()

    channel(): string {
        return "logs"
    }

    async handle(event: Electron.CrossProcessExports.IpcMainInvokeEvent, message: IORMTimestampFilter): Promise<IEncodedLog[]> {

        // just allow reading 1000 rows as maximum
        if (message.limit > 1000) message.limit = 1000

        return this._orm.readByTimestamp(message)
    }


}

/**
 * ipc main Controller that helps renderer retrieve log in database
 */
export const logController = new LogController();