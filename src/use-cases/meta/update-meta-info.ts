import type {
  MetaInfoServiceInterface,
  MetaInfoUpdateSideEffect,
} from "use-cases/interfaces/meta-service";
import type { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-db";

import { pick } from "common/util/other";
import { MetaInformation } from "entities/meta";
import { PublicMetaFields } from "entities/meta";

export interface makeUpdateMetaInfo_Arg {
  sideEffect?: MetaInfoUpdateSideEffect | undefined;
  db: Pick<MetaInformationDatabaseInterface, "get" | "set">;
}
export function makeUpdateMetaInfo(
  builderArg: makeUpdateMetaInfo_Arg
): MetaInfoServiceInterface["update"] {
  const { db, sideEffect = () => {} } = builderArg;

  return async function updateMetaInfo(arg) {
    const { audience, changes } = arg;

    const metaInfo = await db.get();
    const edited = MetaInformation.edit({ audience, changes, metaInfo } as any);

    await db.set(edited);

    const filtered =
      audience === "private" ? edited : (pick(edited, PublicMetaFields) as any);

    if (audience === "public") sideEffect(filtered);

    return filtered;
  };
}
