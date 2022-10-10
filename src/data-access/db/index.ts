import { fork } from "child_process";
import { getDbConfig } from "src/config";
import { DbSubProcess } from "./interface";
import SqliteDatabase from "./mainprocess-db";

const dbConfig = getDbConfig();

const database = new SqliteDatabase({
  makeDbSubProcess,
  sqliteDbPath: dbConfig.SQLITE_DB_PATH,
  dbCloseTimeoutMsWhenKilling: dbConfig.DB_CLOSE_TIMEOUT_WHEN_KILLING,
});
export default database;

function makeDbSubProcess(): DbSubProcess {
  return fork(dbConfig.SQLITE_SUB_PROCESS_MODULE_PATH, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

// @TODO still have to do a lot of error handling and checking
// I'm just trying to set up the db to develop the categoryDb and ProjectsDb
export async function initializeDatabase(db: SqliteDatabase) {
  {
    const result = await db.pragma({ command: "integrity_check" });
    if (String(result).toLowerCase() !== "ok")
      throw new Error(`Database is corrupted: ${result}`);
  }

  for (const [pragma, value] of Object.entries(dbConfig.pragmas)) {
    await db.pragma({ command: `${pragma}=${value}` });
  }

  {
    const table = await db.pragma({ command: "foreign_key_check" });
    if (table)
      throw new Error(
        `Database is corrupted: foreign key constraint violated in table: "${table}"`
      );
  }

  await db.execute({ sql: dbConfig.tables.categories });
  await db.execute({ sql: dbConfig.tables.projects });
}
