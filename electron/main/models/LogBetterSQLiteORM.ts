import Database from "better-sqlite3";
import { ISimpleSyncORM } from "../base/ISimpleSyncORM";
import { IEncodedLog } from "../../../src/ipc-shared/Log";
import { IORMTimestampFilter } from "@/ipc-shared/IORMTimestampFilter";
import { GlobalSqliteDatabase } from "./GlobalSqliteDatabase";


export class LogBetterSQLiteORM implements ISimpleSyncORM<IEncodedLog> {


  private static instance: LogBetterSQLiteORM;
  private db: Database.Database = GlobalSqliteDatabase;

  // 🌟 Singleton accessor
  public static getInstance(): LogBetterSQLiteORM {
    if (!LogBetterSQLiteORM.instance) {
      LogBetterSQLiteORM.instance = new LogBetterSQLiteORM();
    }
    return LogBetterSQLiteORM.instance;
  }

  
  private constructor() {
   

    //* ============ PatchPlan 26-10-19 ========
    /*
     * SubLog dùng CHUNG `log_id` với Log chính (LogiAPI §2: một phiên bơm có 1 Log và 0..n SubLog liên kết
     * với Log đó), nên `log_id` KHÔNG được là khoá chính: bản cũ đặt `log_id TEXT PRIMARY KEY` làm insert
     * SubLog đầu tiên văng lỗi `UNIQUE constraint failed: logs.log_id` và sập main process.
     * Khoá chính giờ là `id` tự tăng; mỗi dòng được định danh bởi cặp (log_id, sublog_id).
     * Bảng cũ (nếu có) bị xoá và tạo lại, xem migrateLegacySchema().
     */
    this.migrateLegacySchema();
    // * =========== End PatchPlan 26-10-19  ========

    // Create table if not exists
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id TEXT NOT NULL,
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

    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_logs_log_id ON logs (log_id)`).run();
    // Log: sublog_id NULL. SubLog: sublog_id riêng. Cùng (log_id, sublog_id) = cùng 1 sự kiện (gửi lại).
    this.db.prepare(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_logs_log_sublog ON logs (log_id, IFNULL(sublog_id, ''))
    `).run();
  }

  //* ============ PatchPlan 26-10-19 ========
  /** Các cột của IEncodedLog (không gồm `id` nội bộ) */
  private static readonly COLUMNS =
    "log_id, message_id, message_type, device_id, timestamp, cost, volume, price, event_type, " +
    "created_timestamp, log_type, sublog_id, sublog_type, note";

  /**
   * `logs.db` cũ có `log_id` là PRIMARY KEY (không lưu được SubLog). Chủ sở hữu đã xác nhận không cần giữ
   * dữ liệu cũ nên bảng cũ bị XOÁ và tạo lại theo schema mới. Không làm gì nếu bảng chưa có hoặc đã là
   * schema mới (có cột `id`).
   */
  private migrateLegacySchema(): void {
    const columns = this.db.prepare(`PRAGMA table_info(logs)`).all() as { name: string }[];
    if (columns.length === 0 || columns.some((column) => column.name === "id")) return;

    this.db.prepare(`DROP TABLE logs`).run();
  }
  // * =========== End PatchPlan 26-10-19  ========

  create(data: IEncodedLog): IEncodedLog {
    //* ============ PatchPlan 26-10-19 ========
    // OR IGNORE: Device Service có thể gửi lại cùng 1 sự kiện sau khi kết nối lại, không được coi là lỗi.
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO logs (
        ${LogBetterSQLiteORM.COLUMNS}
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    // * =========== End PatchPlan 26-10-19  ========

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
      data.created_timestamp ?? null,
      data.log_type ?? null,
      data.sublog_id ?? null,
      data.sublog_type ?? null,
      data.note ?? null
    );

    return data;
  }

  read(log_id: string): IEncodedLog | null {
    // Log chính của phiên bơm (dòng đầu tiên). SubLog của phiên đó dùng cùng log_id nhưng có sublog_id.
    const stmt = this.db.prepare(`SELECT ${LogBetterSQLiteORM.COLUMNS} FROM logs WHERE log_id = ? ORDER BY id LIMIT 1`);
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
      WHERE id = (SELECT id FROM logs WHERE log_id = ? ORDER BY id LIMIT 1)
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
    // Xoá cả Log lẫn các SubLog của nó
    const stmt = this.db.prepare(`DELETE FROM logs WHERE log_id = ?`);
    const result = stmt.run(log_id);
    return result.changes > 0;
  }

  readByTimestamp(filter: IORMTimestampFilter = {
    beginTs: 0,
    endTs: Date.now(),
    limit: 1000,
    priority: "newest"
  }): IEncodedLog[] {

    // Set defaults if undefined
    const beginTs = filter.beginTs ?? 0;
    const endTs = filter.endTs ?? Date.now();
    const limit = filter.limit ?? 1000;
    const order = filter.priority === "oldest" ? "ASC" : "DESC";

    let query = `
    SELECT ${LogBetterSQLiteORM.COLUMNS} FROM logs
    WHERE timestamp BETWEEN ? AND ?
  `;

    const params: any[] = [beginTs, endTs];

    // Add device_id filter if provided
    if (filter.deviceID) {
      query += ` AND device_id = ?`;
      params.push(filter.deviceID);
    }

    query += ` ORDER BY timestamp ${order} LIMIT ?`;
    params.push(limit);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);

    return rows as IEncodedLog[];
  }






}

