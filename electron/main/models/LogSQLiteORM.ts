// import { IEncodedLog } from "electron/ipc-shared/Log";
// import { ISimpleORM } from "../base/ISimpleORM";
// import sqlite3 from "sqlite3";
// import { open, Database } from "sqlite";

// export class LogSQLiteORM implements ISimpleORM<IEncodedLog> {
//     private dbPromise: Promise<Database>;

//     constructor(private dbPath: string = "logs.db") {
//         this.dbPromise = open({
//             filename: this.dbPath,
//             driver: sqlite3.Database
//         }).then(async (db: Database) => {
//             await db.run(`
//                 CREATE TABLE IF NOT EXISTS logs (
//                     log_id TEXT PRIMARY KEY,
//                     message_id TEXT,
//                     message_type INTEGER,
//                     device_id TEXT,
//                     timestamp INTEGER,
//                     cost REAL,
//                     volume REAL,
//                     price REAL,
//                     event_type TEXT,
//                     created_timestamp INTEGER,
//                     log_type INTEGER,
//                     sublog_id TEXT,
//                     sublog_type INTEGER,
//                     note TEXT
//                 )
//             `);
//             return db;
//         });
//     }

//     async create(data: IEncodedLog): Promise<IEncodedLog> {
//         const db = await this.dbPromise;
//         await db.run(
//             `INSERT INTO logs (
//                 log_id, message_id, message_type, device_id, timestamp, cost, volume, price, event_type, created_timestamp, log_type, sublog_id, sublog_type, note
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//             data.log_id,
//             data.message_id,
//             data.message_type,
//             data.device_id,
//             data.timestamp,
//             data.cost,
//             data.volume,
//             data.price,
//             data.event_type,
//             data.created_timestamp,
//             data.log_type,
//             data.sublog_id,
//             data.sublog_type,
//             data.note
//         );
//         return data;
//     }

//     async read(log_id: string): Promise<IEncodedLog | null> {
//         const db = await this.dbPromise;
//         const row = await db.get(
//             `SELECT * FROM logs WHERE log_id = ?`,
//             log_id
//         );
//         return row ? (row as IEncodedLog) : null;
//     }

//     async update(log_id: string, data: Partial<IEncodedLog>): Promise<IEncodedLog | null> {
//         const db = await this.dbPromise;
//         const existing = await this.read(log_id);
//         if (!existing) return null;

//         const updated: IEncodedLog = { ...existing, ...data };
//         await db.run(
//             `UPDATE logs SET 
//                 message_id = ?, 
//                 message_type = ?, 
//                 device_id = ?, 
//                 timestamp = ?, 
//                 cost = ?, 
//                 volume = ?, 
//                 price = ?, 
//                 event_type = ?, 
//                 created_timestamp = ?, 
//                 log_type = ?, 
//                 sublog_id = ?, 
//                 sublog_type = ?, 
//                 note = ? 
//             WHERE log_id = ?`,
//             updated.message_id,
//             updated.message_type,
//             updated.device_id,
//             updated.timestamp,
//             updated.cost,
//             updated.volume,
//             updated.price,
//             updated.event_type,
//             updated.created_timestamp,
//             updated.log_type,
//             updated.sublog_id,
//             updated.sublog_type,
//             updated.note,
//             log_id
//         );
//         return updated;
//     }

//     async delete(log_id: string): Promise<boolean> {
//         const db = await this.dbPromise;
//         const result = await db.run(
//             `DELETE FROM logs WHERE log_id = ?`,
//             log_id
//         );
//         return (result.changes ?? 0) > 0;
//     }
// }