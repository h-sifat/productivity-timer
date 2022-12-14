import { fork } from "child_process";
import { getConfig } from "src/config";
import { DbSubProcess } from "./interface";
import SqliteDatabase from "./mainprocess-db";

const config = getConfig();

const database = new SqliteDatabase({
  makeDbSubProcess,
  sqliteDbPath: config.DB_PATH,
  dbCloseTimeoutMsWhenKilling: config.DB_CLOSE_TIMEOUT_WHEN_KILLING,
});

export default database;

function makeDbSubProcess(): DbSubProcess {
  return fork(config.DB_SUB_PROCESS_MODULE_PATH, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}
