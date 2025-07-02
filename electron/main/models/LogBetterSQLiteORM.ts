import Database from "better-sqlite3";
import { ISimpleSyncORM } from "../base/ISimpleSyncORM";
import { IEncodedLog } from "../../ipc-shared/Log";


export class LogBetterSQLiteORM implements ISimpleSyncORM<IEncodedLog> {
  private db: Database.Database;

  constructor(dbPath: string = "logs.db") {
    this.db = new Database(dbPath);

    // Create table if not exists
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS logs (
        log_id TEXT PRIMARY KEY,
        message_id TEXT,
        message_type INTEGER,
        device_id TEXT,
        timestamp INTEGER,
        cost REAL,
        volume REAL,
        price REAL,
        event_type TEXT,
        created_timestamp INTEGER,
        log_type INTEGER,
        sublog_id TEXT,
        sublog_type INTEGER,
        note TEXT
      )
    `).run();
  }

  create(data: IEncodedLog): IEncodedLog {
    const stmt = this.db.prepare(`
      INSERT INTO logs (
        log_id, message_id, message_type, device_id, timestamp, cost, volume, price, event_type, created_timestamp, log_type, sublog_id, sublog_type, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.log_id,
      data.message_id,
      data.message_type,
      data.device_id,
      data.timestamp,
      data.cost,
      data.volume,
      data.price,
      data.event_type,
      data.created_timestamp,
      data.log_type,
      data.sublog_id,
      data.sublog_type,
      data.note
    );

    return data;
  }

  read(log_id: string): IEncodedLog | null {
    const stmt = this.db.prepare(`SELECT * FROM logs WHERE log_id = ?`);
    const row = stmt.get(log_id);
    return row ? (row as IEncodedLog) : null;
  }

  update(log_id: string, data: Partial<IEncodedLog>): IEncodedLog | null {
    const existing = this.read(log_id);
    if (!existing) return null;

    const updated: IEncodedLog = { ...existing, ...data };

    const stmt = this.db.prepare(`
      UPDATE logs SET
        message_id = ?,
        message_type = ?,
        device_id = ?,
        timestamp = ?,
        cost = ?,
        volume = ?,
        price = ?,
        event_type = ?,
        created_timestamp = ?,
        log_type = ?,
        sublog_id = ?,
        sublog_type = ?,
        note = ?
      WHERE log_id = ?
    `);

    stmt.run(
      updated.message_id,
      updated.message_type,
      updated.device_id,
      updated.timestamp,
      updated.cost,
      updated.volume,
      updated.price,
      updated.event_type,
      updated.created_timestamp,
      updated.log_type,
      updated.sublog_id,
      updated.sublog_type,
      updated.note,
      log_id
    );

    return updated;
  }

  async delete(log_id: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM logs WHERE log_id = ?`);
    const result = stmt.run(log_id);
    return result.changes > 0;
  }
}
