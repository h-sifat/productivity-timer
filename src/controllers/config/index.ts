import type { ConfigControllerInterface } from "./interface";
import type { PublicConfigInterface } from "src/config/interface";

import { makeGetConfig } from "./get";

export interface makeConfigController_Argument {
  config: PublicConfigInterface;
}
export function makeConfigController(
  factoryArg: makeConfigController_Argument
): ConfigControllerInterface {
  const { config } = factoryArg;

  const controllers: ConfigControllerInterface = {
    get: makeGetConfig({ config }),
  };

  return Object.freeze(controllers);
}
