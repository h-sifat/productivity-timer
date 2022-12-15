import { fork } from "child_process";
import { getConfig } from "src/config";
import { DbSubProcess } from "./interface";

const config = getConfig();

export function makeDbSubProcess(): DbSubProcess {
  return fork(config.DB_SUB_PROCESS_MODULE_PATH, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}
