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
