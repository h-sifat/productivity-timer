import { existsSync } from "fs";
import EPP from "common/util/epp";
import { fork } from "child_process";
import { getConfig } from "src/config";
import { DbSubProcess } from "./interface";

export function makeDbSubProcess(): DbSubProcess {
  // it's important to get the config dynamically
  const modulePath = getConfig().DB_SUB_PROCESS_MODULE_PATH;

  if (existsSync(modulePath))
    return fork(modulePath, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

  throw new EPP({
    code: "DB_SUBPROCESS_MODULE_NOT_FOUND",
    message: `The subprocess module ("${modulePath}") has been deleted.`,
  });
}
