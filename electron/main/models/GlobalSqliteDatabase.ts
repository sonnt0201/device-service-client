import Database from "better-sqlite3";
import { app } from "electron";
import fs from "fs";
import path from "path";

/**
 * Global sqlite database object refering to logs.db (common database file)
 * for common usage to keep only one file locking
 */
const resolveDatabasePath = () => {
	const userDataPath = app.getPath("userData");
	const dbDir = path.join(userDataPath, "data");
	fs.mkdirSync(dbDir, { recursive: true });
	return path.join(dbDir, "logs.db");
};

export const GlobalSqliteDatabase = new Database(resolveDatabasePath());