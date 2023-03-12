import { initializeDatabase } from "data-access/init-db";
import { TABLE_SCHEMAS, TABLE_SCHEMA_ORDER } from "data-access/schemas";

import Database from "better-sqlite3";
import { getAllTableNames } from "data-access/util";
import type { Database as SqliteDatabase } from "better-sqlite3";

const IN_MEMORY_DB_PATH = ":memory:";
let database: SqliteDatabase;

beforeEach(() => {
  database = new Database(IN_MEMORY_DB_PATH);
});

afterEach(() => {
  database.close();
});

describe("initializeDatabase", () => {
  {
    const errorCode = "DB_CORRUPTED:F_KEY_VIOLATION";

    it(`throws ewc '${errorCode}' if any table violates the foreign key constraint`, async () => {
      expect.assertions(1);

      // turning off this rule, so that I can commit some nasty sin down the road
      database.pragma("foreign_keys = OFF");

      // violating foreign key constraint manually
      database.exec(
        `create table parent(id integer primary key);
         create table child(x references parent(id));
         insert into child values (1);`
      );

      try {
        await initializeDatabase(database);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  it(`creates all the tables defined in the TABLE_SCHEMAS object`, async () => {
    {
      const allTableNames = getAllTableNames({ db: database });
      expect(allTableNames).toEqual([]);
    }

    await initializeDatabase(database);

    {
      const allTableNames = getAllTableNames({ db: database });

      expect(allTableNames.length).toBe(Object.keys(TABLE_SCHEMAS).length);

      allTableNames.sort();
      expect(allTableNames).toEqual([...Object.keys(TABLE_SCHEMAS)].sort());
    }
  });

  {
    const errorCode = "DB_CORRUPTED:UNKNOWN_TABLE";

    it(`throws ewc "${errorCode}" if the db contains unknown table`, async () => {
      expect.assertions(2);

      // will create all the tables as the db is empty
      await initializeDatabase(database);

      const unknownTableName = "my_dead_duck_used_to_say_quack";
      expect(TABLE_SCHEMAS).not.toHaveProperty(unknownTableName);

      database.exec(`create table ${unknownTableName} (x);`);

      try {
        await initializeDatabase(database);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "DB_CORRUPTED:TABLE_DELETED";

    it(`throws ewc "${errorCode}" if table(s) are deleted from the db`, async () => {
      expect.assertions(2);

      // will create all the tables as the db is empty
      await initializeDatabase(database);

      {
        const deletedTableName = TABLE_SCHEMA_ORDER[0];
        database.exec(`drop table ${deletedTableName}`);

        const allTableNames = getAllTableNames({ db: database });
        expect(allTableNames.includes(deletedTableName)).toBeFalsy();
      }

      try {
        await initializeDatabase(database);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});
