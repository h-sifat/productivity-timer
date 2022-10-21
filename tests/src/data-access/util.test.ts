import db from "data-access/db";
import { getAllTableNames, makeGetMaxId } from "data-access/util";
import { typeNames } from "handy-types";

describe("makeGetMaxId", () => {
  const db = Object.freeze({
    prepare: jest.fn(),
    executePrepared: jest.fn(),
  });

  const maxIdColumnName = "maxId";
  const preparedQueryName = "cat/getMaxId";
  const preparedQueryStatement = "select max(id) from duck;";

  const getMaxId = makeGetMaxId({
    db,
    maxIdColumnName,
    preparedQueryName,
    preparedQueryStatement,
  });

  beforeEach(() => {
    Object.values(db).forEach((method) => method.mockReset());
  });

  it(`returns the maxId`, async () => {
    const maxId = 100;
    db.executePrepared.mockReturnValueOnce([{ [maxIdColumnName]: maxId }]);

    const result = await getMaxId();

    expect(result).toBe(maxId);

    expect(db.prepare).toHaveBeenCalledTimes(1);
    expect(db.executePrepared).toHaveBeenCalledTimes(1);

    expect(db.prepare).toHaveBeenCalledWith({
      name: preparedQueryName,
      overrideIfExists: false,
      statement: preparedQueryStatement,
    });

    expect(db.executePrepared).toHaveBeenCalledWith({
      name: preparedQueryName,
    });
  });

  it(`returns 1 if maxId is null (i.e. table is empty)`, async () => {
    db.executePrepared.mockReturnValueOnce([{ [maxIdColumnName]: null }]);

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
