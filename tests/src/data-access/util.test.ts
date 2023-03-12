import Database from "better-sqlite3";
import type { Database as SqliteDatabase } from "better-sqlite3";

const IN_MEMORY_DB_PATH = ":memory:";
let database: SqliteDatabase;

beforeEach(() => {
  database = new Database(IN_MEMORY_DB_PATH);
});

afterEach(() => {
  database.close();
});

import { getAllTableNames, makeGetMaxId } from "data-access/util";

describe("makeGetMaxId", () => {
  it(`returns the maxId`, async () => {
    const TABLE_NAME = "users";

    database.exec(
      `create table ${TABLE_NAME} (id integer primary key, name text);`
    );

    const getMaxId = makeGetMaxId({
      db: database,
      idFieldName: "id",
      tableName: TABLE_NAME,
    });

    // as table is empty it should be 0
    const maxIdBefore = getMaxId();
    expect(maxIdBefore).toBe(0);

    database.exec(`insert into ${TABLE_NAME} (name) values ('A');`);

    const maxIdAfter = getMaxId();
    expect(maxIdAfter).toBe(1);
  });
});

describe("getAllTableNames", () => {
  it(`returns an empty array if the db is empty`, async () => {
    const tables = getAllTableNames({ db: database });
    expect(tables).toEqual([]);
  });

  it(`returns all the table names`, async () => {
    const TABLE_NAME = "tbl";
    const INDEX_NAME = `${TABLE_NAME}_idx`;

    database.exec(
      `create table ${TABLE_NAME}(x);
      create index ${INDEX_NAME} on ${TABLE_NAME} (x);`
    );

    const tables = getAllTableNames({ db: database });

    // the index name should not show up
    expect(tables).toEqual([TABLE_NAME]);
  });
});
