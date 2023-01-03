import { makeDbSubProcess } from "data-access/db";
import { DEFAULT_META_INFO, MIN_DAILY_WORK_TARGET_MS } from "entities/meta";
import { initializeDatabase } from "data-access/init-db";
import SqliteDatabase from "data-access/db/mainprocess-db";
import {
  buildMetaInfoDatabase,
  TABLE_NAME as MetaInfoTableName,
  META_INFO_RECORD_ID,
} from "data-access/meta-db";
import { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-db";

const IN_MEMORY_DB_PATH = ":memory:";
const _internalDb_ = new SqliteDatabase({
  makeDbSubProcess,
  dbCloseTimeoutMsWhenKilling: 30,
  sqliteDbPath: IN_MEMORY_DB_PATH,
});

let metaInfoDb: MetaInformationDatabaseInterface;
const notifyDatabaseCorruption = jest.fn();

const PREPARED_QUERY_NAMES = Object.freeze({
  setJSONManually: "test/meta/set-json",
  setHashManually: "test/meta/set-hash",
});

const PREPARED_QUERY_STATEMENTS = Object.freeze({
  setJSONManually: `update ${MetaInfoTableName} set json = $json where id = ${META_INFO_RECORD_ID};`,
  setHashManually: `update ${MetaInfoTableName} set hash = $hash where id = ${META_INFO_RECORD_ID};`,
});

// -----    Test setup -----------------
beforeEach(async () => {
  await _internalDb_.open({ path: IN_MEMORY_DB_PATH });
  await initializeDatabase(_internalDb_);

  for (const queryName in PREPARED_QUERY_NAMES) {
    const statement = (PREPARED_QUERY_STATEMENTS as any)[queryName];
    await _internalDb_.prepare({
      name: (<any>PREPARED_QUERY_NAMES)[queryName],
      statement,
      overrideIfExists: false,
    });
  }

  if (!metaInfoDb)
    metaInfoDb = buildMetaInfoDatabase({
      db: _internalDb_,
      notifyDatabaseCorruption,
    });

  notifyDatabaseCorruption.mockReset();
});

afterEach(async () => {
  await _internalDb_.close();
});

afterAll(async () => {
  await _internalDb_.kill();
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
      lastBackupTime: Date.now(),
      dailyWorkTargetMs: MIN_DAILY_WORK_TARGET_MS,
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
      await _internalDb_.runPrepared({
        name: PREPARED_QUERY_NAMES.setJSONManually,
        statementArgs: { json },
      });

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
