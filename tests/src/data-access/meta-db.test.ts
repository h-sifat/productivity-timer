import {
  META_INFO_RECORD_ID,
  buildMetaInfoDatabase,
  TABLE_NAME as MetaInfoTableName,
} from "data-access/meta-db";
import { DEFAULT_META_INFO } from "entities/meta";
import { initializeDatabase } from "data-access/init-db";
import { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-db";

import Database from "better-sqlite3";
import type { Database as SqliteDatabase } from "better-sqlite3";
import { PreparedQueryStatements } from "data-access/interface";
import { prepareQueries } from "data-access/util";

const IN_MEMORY_DB_PATH = ":memory:";

let metaInfoDb: MetaInformationDatabaseInterface;
const notifyDatabaseCorruption = jest.fn();

const queries = Object.freeze({
  setJSONManually: `update ${MetaInfoTableName} set json = $json where id = ${META_INFO_RECORD_ID};`,
  setHashManually: `update ${MetaInfoTableName} set hash = $hash where id = ${META_INFO_RECORD_ID};`,
});

let preparedQueryStatements: PreparedQueryStatements<typeof queries>;
let _internalDb_: SqliteDatabase;

// -----    Test setup -----------------
beforeEach(async () => {
  _internalDb_ = new Database(IN_MEMORY_DB_PATH);
  await initializeDatabase(_internalDb_);
  preparedQueryStatements = prepareQueries({ db: _internalDb_, queries });

  metaInfoDb = buildMetaInfoDatabase({
    db: _internalDb_,
    notifyDatabaseCorruption,
  });

  notifyDatabaseCorruption.mockReset();
});

afterEach(async () => {
  _internalDb_.close();
});

// -----    Test setup -----------------

describe("get/set", () => {
  it(`returns the default meta info if it's not set`, async () => {
    // currently db is uninitialized
    const metaInfo = await metaInfoDb.get();
    expect(metaInfo).toEqual(DEFAULT_META_INFO);
  });

  it(`sets the meta info`, async () => {
    const insertedMetaInfo = Object.freeze({
      version: "1.0.0",
      lastBackupTime: Date.now(),
    });
    await metaInfoDb.set(insertedMetaInfo);

    const metaInfo = await metaInfoDb.get();
    expect(metaInfo).toEqual(insertedMetaInfo);
  });
});

describe("Corruption Handling", () => {
  const DB_CORRUPTED = "DB_CORRUPTED";
  it.each([
    {
      json: "invalid json",
      case: `the "json" column is an invalid JSON string`,
    },
    {
      json: JSON.stringify({ lastBackupTime: "invalid_time" }),
      case: `the "json" column is an invalid metaInfo object`,
    },
  ])(
    `throws ewc "${DB_CORRUPTED}" and calls the notifyDatabaseCorruption func if $case`,
    async ({ json }) => {
      expect.assertions(4);

      // this will populate the db with DEFAULT_META_INFO
      await metaInfoDb.get();

      // manually setting the json value
      preparedQueryStatements.setJSONManually.run({ json });

      expect(notifyDatabaseCorruption).not.toHaveBeenCalled();
      try {
        await metaInfoDb.get();
      } catch (ex) {
        expect(notifyDatabaseCorruption).toHaveBeenCalledTimes(1);
        expect(notifyDatabaseCorruption).toHaveBeenCalledWith(ex);

        expect(ex.code).toEqual(DB_CORRUPTED);
      }
    }
  );
});
