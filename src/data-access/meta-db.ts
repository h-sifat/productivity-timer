import {
  MetaInformation,
  DEFAULT_META_INFO,
  generateMetaInfoHash,
  MetaInformationInterface,
} from "entities/meta";
import EPP from "common/util/epp";
import { asyncifyDatabaseMethods, prepareQueries } from "./util";
import { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-db";

import type { Database as SqliteDatabase } from "better-sqlite3";

interface BuildMetaInfoDatabase_Argument {
  db: SqliteDatabase;
  notifyDatabaseCorruption: (arg: any) => void;
}

export const TABLE_NAME = "meta_info";
export const META_INFO_RECORD_ID = 1;

const queries = Object.freeze({
  get: `select json, hash from ${TABLE_NAME} where id = ${META_INFO_RECORD_ID};`,
  set: `insert into ${TABLE_NAME} (id, json, hash)
  values (${META_INFO_RECORD_ID}, $json, $hash)
  on conflict(id) do update 
    set json = $json,
    hash = $hash;`,
});

export function buildMetaInfoDatabase(
  builderArg: BuildMetaInfoDatabase_Argument
): MetaInformationDatabaseInterface {
  const { db, notifyDatabaseCorruption } = builderArg;
  const preparedQueryStatements = prepareQueries({ db, queries });

  // @ts-ignore
  const getTransaction = db.transaction(() => {
    const result = preparedQueryStatements.get.all();

    if (!result.length) {
      set(DEFAULT_META_INFO);
      return DEFAULT_META_INFO;
    }

    let metaInfo: any;
    try {
      const { json, hash } = result[0] as any;
      metaInfo = JSON.parse(json);
      MetaInformation.validate(metaInfo, hash);
      return metaInfo;
    } catch (ex) {
      const throwError = (): never => {
        const error = new EPP({
          code: "DB_CORRUPTED",
          otherInfo: { originalError: ex },
          message: `The meta_info table is corrupted.`,
        });
        notifyDatabaseCorruption(error);
        throw error;
      };

      if (!metaInfo) throwError();

      let newMetaInfo: any = {};

      // the v1.0.0 have no version field. that's means we're upgrading from
      // v1.0.0
      if (!metaInfo.version)
        newMetaInfo = {
          ...DEFAULT_META_INFO,
          lastBackupTime: metaInfo.lastBackupTime,
        };
      // we're probably upgrading or downgrading from the current version
      else if (metaInfo.version !== DEFAULT_META_INFO.version)
        newMetaInfo = { ...metaInfo, version: DEFAULT_META_INFO.version };
      else throwError();

      try {
        MetaInformation.validate(newMetaInfo);
        set(newMetaInfo);
        return newMetaInfo;
      } catch (ex) {
        throwError();
      }
    }
  });

  function set(metaInfo: MetaInformationInterface) {
    const json = JSON.stringify(metaInfo);
    const hash = generateMetaInfoHash(metaInfo);

    preparedQueryStatements.set.run({ json, hash });
  }

  const metaInfoDatabase: MetaInformationDatabaseInterface = Object.freeze(
    asyncifyDatabaseMethods({ get: () => getTransaction.immediate(), set })
  );

  return metaInfoDatabase;
}
