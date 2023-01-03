import { pick } from "common/util/other";
import { PublicMetaFields } from "entities/meta";
import type { MetaInfoServiceInterface } from "use-cases/interfaces/meta-service";
import type { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-db";

export interface makeGetMetaInfo_Argument {
  db: Pick<MetaInformationDatabaseInterface, "get">;
}
export function makeGetMetaInfo(
  builderArg: makeGetMetaInfo_Argument
): MetaInfoServiceInterface["get"] {
  const { db } = builderArg;

  return async function getMetaInfo(arg) {
    const { audience } = arg;

    const metaInfo = await db.get();
    return audience === "private" ? metaInfo : pick(metaInfo, PublicMetaFields);
  };
}
