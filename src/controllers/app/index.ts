import { makePostAppCommand } from "./post-command";
import type { BackupDatabase } from "data-access/backup";
import type { AppControllerInterface } from "./interface";

export interface makeAppControllers_Argument {
  backupDatabase: BackupDatabase;
  closeApplication(exitCode?: number): Promise<void>;
}
export function makeAppControllers(
  factoryArg: makeAppControllers_Argument
): AppControllerInterface {
  const { closeApplication, backupDatabase } = factoryArg;

  const controllers: AppControllerInterface = {
    post: makePostAppCommand({ closeApplication, backupDatabase }),
  };

  return Object.freeze(controllers);
}
