import { PublicConfigInterface } from "src/config/interface";
import { ConfigControllerInterface } from "./interface";

interface makeGetConfig_Argument {
  config: PublicConfigInterface;
}

export function makeGetConfig(
  factoryArg: makeGetConfig_Argument
): ConfigControllerInterface["get"] {
  const { config } = factoryArg;

  return async function get(_request) {
    return { body: { success: true, data: config } };
  };
}
