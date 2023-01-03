import { makeGetMetaInfo } from "./get-meta-info";
import { makeUpdateMetaInfo } from "./update-meta-info";
import { MetaInfoServiceInterface } from "use-cases/interfaces/meta-service";
import { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-db";

export interface makeMetaInformationService_Argument {
  db: MetaInformationDatabaseInterface;
}
export function makeMetaInformationService(
  arg: makeMetaInformationService_Argument
): MetaInfoServiceInterface {
  const { db } = arg;

  const service: MetaInfoServiceInterface = {
    get: makeGetMetaInfo({ db }),
    update: makeUpdateMetaInfo({ db }),
  };

  return Object.freeze(service);
}
