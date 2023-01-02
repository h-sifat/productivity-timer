import {
  DEFAULT_META_INFO,
  generateMetaInfoHash,
  MetaInformationInterface,
  validateMetaInformation,
} from "entities/meta-info";
import EPP from "common/util/epp";
import { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-info-db";

import type SqliteDatabase from "./db/mainprocess-db";

interface BuildMetaInfoDatabase_Argument {
  db: SqliteDatabase;
  notifyDatabaseCorruption: (arg: any) => void;
}

export const TABLE_NAME = "meta_info";
export const META_INFO_RECORD_ID = 1;

const PREPARED_QUERY_NAMES = Object.freeze({
  get: "meta/get",
  set: "meta/set",
});

const PREPARED_QUERY_STATEMENTS: {
  [key in keyof typeof PREPARED_QUERY_NAMES]: string;
} = Object.freeze({
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

  const metaInfoDatabase: MetaInformationDatabaseInterface = { get, set };
  return Object.freeze(metaInfoDatabase);

  async function get(): Promise<MetaInformationInterface> {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.get,
      statement: PREPARED_QUERY_STATEMENTS.get,
    });

    const result = await db.executePrepared({ name: PREPARED_QUERY_NAMES.get });

    if (!result.length) {
      await set(DEFAULT_META_INFO);
      return DEFAULT_META_INFO;
    }

    try {
      const { json, hash } = result[0] as any;
      const metaInfo = JSON.parse(json);
      validateMetaInformation(metaInfo, hash);
      return metaInfo;
    } catch (ex) {
      const error = new EPP({
        code: "DB_CORRUPTED",
        otherInfo: { originalError: ex },
        message: `The meta_info table is corrupted.`,
      });
      notifyDatabaseCorruption(error);

      throw error;
    }
  }

  async function set(metaInfo: MetaInformationInterface) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.set,
      statement: PREPARED_QUERY_STATEMENTS.set,
    });

    const json = JSON.stringify(metaInfo);
    const hash = generateMetaInfoHash(metaInfo);

    await db.runPrepared({
      statementArgs: { json, hash },
      name: PREPARED_QUERY_NAMES.set,
    });
  }
}
