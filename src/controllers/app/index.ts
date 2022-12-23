import { makePostAppCommand } from "./post-command";
import type { AppControllerInterface } from "./interface";

export interface makeAppControllers_Argument {
  closeApplication(exitCode?: number): Promise<void>;
}
export function makeAppControllers(
  factoryArg: makeAppControllers_Argument
): AppControllerInterface {
  const { closeApplication } = factoryArg;

  const controllers: AppControllerInterface = {
    post: makePostAppCommand({ closeApplication }),
  };

  return Object.freeze(controllers);
}
