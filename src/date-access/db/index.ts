import { fork } from "child_process";
import { getDbConfig } from "src/config";
import { DbSubProcess } from "./interface";
import SqliteDatabase from "./mainprocess-db";

const dbConfig = getDbConfig();

function makeDbSubProcess(): DbSubProcess {
  return fork(dbConfig.SQLITE_SUB_PROCESS_MODULE_PATH, {
    stdio: "ignore",
    cwd: process.cwd(),
  });
}

const db = new SqliteDatabase({
  makeDbSubProcess,
  sqliteDbPath: dbConfig.SQLITE_DB_PATH,
  dbCloseTimeoutMsWhenKilling: dbConfig.DB_CLOSE_TIMEOUT_WHEN_KILLING,
});

// @TODO still have to do a lot of error handling and checking
// I'm just trying to set up the db to develop the categoryDb and ProjectsDb
async function initDb(db: SqliteDatabase) {
  {
    const result = await db.pragma({ command: "integrity_check" });
    if (String(result).toLowerCase() !== "ok")
      throw new Error(`Database is corrupted: ${result}`);
  }

  for (const [pragma, value] of Object.entries(dbConfig.pragmas)) {
    await db.pragma({ command: `${pragma}=${value}` });
  }

  {
    const result = await db.pragma({ command: "foreign_key_check" });
    if (String(result).toLowerCase() !== "ok")
      throw new Error(`Database is corrupted: ${result}`);
  }

  for (const statement of Object.values(dbConfig.tables))
    await db.execute({ sql: statement });
}

let isDbInitiated = false;
export default async function getDb(): Promise<SqliteDatabase> {
  if (!isDbInitiated) {
    await initDb(db);
    isDbInitiated = true;
  }

  return db;
}
