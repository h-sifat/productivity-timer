import { MetaInformation } from "entities/meta";
import type { MetaInfoServiceInterface } from "use-cases/interfaces/meta-service";
import type { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-db";

export interface makeUpdateMetaInfo_Arg {
  db: Pick<MetaInformationDatabaseInterface, "get" | "set">;
}
export function makeUpdateMetaInfo(
  builderArg: makeUpdateMetaInfo_Arg
): MetaInfoServiceInterface["update"] {
  const { db } = builderArg;

  return async function updateMetaInfo(arg) {
    const { audience, changes } = arg;

    const metaInfo = await db.get();
    const edited = MetaInformation.edit({ audience, changes, metaInfo } as any);

    await db.set(edited);
    return edited;
  };
}
