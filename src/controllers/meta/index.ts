import { makeGetController } from "./get";
import { makeMetaInfoPatchController } from "./patch-meta-info";

import type { MetaInfoControllerInterface } from "./interface";
import type { MetaInfoServiceInterface } from "use-cases/interfaces/meta-service";

export interface makeMetaInfoControllers_Argument {
  service: MetaInfoServiceInterface;
}
export function makeMetaInfoControllers(
  factoryArg: makeMetaInfoControllers_Argument
): MetaInfoControllerInterface {
  const { service } = factoryArg;

  const controllers: MetaInfoControllerInterface = {
    get: makeGetController({ service }),
    patch: makeMetaInfoPatchController({ service }),
  };

  return Object.freeze(controllers);
}
