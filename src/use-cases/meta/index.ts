import type {
  MetaInfoServiceInterface,
  MetaInfoUpdateSideEffect,
} from "use-cases/interfaces/meta-service";
import type { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-db";

import { makeGetMetaInfo } from "./get-meta-info";
import { makeUpdateMetaInfo } from "./update-meta-info";

export interface makeMetaInformationService_Argument {
  db: MetaInformationDatabaseInterface;
  patchSideEffect?: MetaInfoUpdateSideEffect | undefined;
}
export function makeMetaInformationService(
  arg: makeMetaInformationService_Argument
): MetaInfoServiceInterface {
  const { db, patchSideEffect } = arg;

  const service: MetaInfoServiceInterface = {
    get: makeGetMetaInfo({ db }),
    update: makeUpdateMetaInfo({ db, sideEffect: patchSideEffect }),
  };

  return Object.freeze(service);
}
