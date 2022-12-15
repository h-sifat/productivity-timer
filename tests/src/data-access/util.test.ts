import { makeDbSubProcess } from "data-access/db";
import SqliteDatabase from "data-access/db/mainprocess-db";

const IN_MEMORY_DB_PATH = ":memory:";
const db = new SqliteDatabase({
  makeDbSubProcess,
  dbCloseTimeoutMsWhenKilling: 30,
  sqliteDbPath: IN_MEMORY_DB_PATH,
});

import { getAllTableNames, makeGetMaxId } from "data-access/util";

describe("makeGetMaxId", () => {
  const localDb = Object.freeze({
    prepare: jest.fn(),
    executePrepared: jest.fn(),
  });

  const maxIdColumnName = "maxId";
  const preparedQueryName = "cat/getMaxId";
  const preparedQueryStatement = "select max(id) from duck;";

  const getMaxId = makeGetMaxId({
    db: localDb,
    maxIdColumnName,
    preparedQueryName,
    preparedQueryStatement,
  });

  beforeEach(() => {
    Object.values(localDb).forEach((method) => method.mockReset());
  });

  it(`returns the maxId`, async () => {
    const maxId = 100;
    localDb.executePrepared.mockReturnValueOnce([{ [maxIdColumnName]: maxId }]);

    const result = await getMaxId();

    expect(result).toBe(maxId);

    expect(localDb.prepare).toHaveBeenCalledTimes(1);
    expect(localDb.executePrepared).toHaveBeenCalledTimes(1);

    expect(localDb.prepare).toHaveBeenCalledWith({
      name: preparedQueryName,
      overrideIfExists: false,
      statement: preparedQueryStatement,
    });

    expect(localDb.executePrepared).toHaveBeenCalledWith({
      name: preparedQueryName,
    });
  });

  it(`returns 1 if maxId is null (i.e. table is empty)`, async () => {
    localDb.executePrepared.mockReturnValueOnce([{ [maxIdColumnName]: null }]);

    const result = await getMaxId();
    expect(result).toBe(1);
  });
});

describe("getAllTableNames", () => {
  const IN_MEMORY_DB_PATH = ":memory:";

  beforeEach(async () => {
    await db.open({ path: IN_MEMORY_DB_PATH });
  });

  afterEach(async () => {
    await db.close();
  });

  afterAll(async () => {
    db.kill();
  });

  it(`returns an empty array if the db is empty`, async () => {
    const tables = await getAllTableNames({ db, preparedQueryName: "query" });
    expect(tables).toEqual([]);
  });

  it(`returns all the table names`, async () => {
    const TABLE_NAME = "tbl";
    const INDEX_NAME = `${TABLE_NAME}_idx`;

    await db.execute({
      sql: `create table ${TABLE_NAME}(x);
      create index ${INDEX_NAME} on ${TABLE_NAME} (x);`,
    });

    const tables = await getAllTableNames({ db, preparedQueryName: "query" });

    // the index name should not show up
    expect(tables).toEqual([TABLE_NAME]);
  });
});
