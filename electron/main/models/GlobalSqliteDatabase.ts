import Database from "better-sqlite3";

/**
 * Global sqlite database object refering to logs.db (common database file)
 * for common usage to keep only one file locking
 */
export const GlobalSqliteDatabase = new Database("logs.db")