import database from "data-access/db";
import { getAllTableNames } from "data-access/util";
import { initializeDatabase } from "data-access/init-db";
import { TABLE_SCHEMAS, TABLE_SCHEMA_ORDER } from "data-access/schemas";

beforeEach(async () => {
  await database.open({ path: ":memory:" });
});

afterEach(async () => {
  await database.close();
});

afterAll(async () => {
  await database.kill();
});

describe("initializeDatabase", () => {
  {
    // @WARNING fragile test, coupled to implementation!
    // Right now, I'm too lazy to set up a real test

    const db = Object.freeze({
      pragma: jest.fn(),
      prepare: jest.fn(),
      execute: jest.fn(),
      executePrepared: jest.fn(),
    });

    const dbMethodCounts = Object.keys(db).length;

    const errorCode = "DB_CORRUPTED:INTEGRITY_VIOLATION";

    it(`throws ewc "${errorCode}" if pragma "integrity_check" doesn't return ok`, async () => {
      expect.assertions(2 + dbMethodCounts);
      // 1 error code + 1 toHaveBeenCalledWith + dbMethodCounts

      // the first call should be "integrity_check"
      // and we'll return the following error
      db.pragma.mockReturnValueOnce("Database disk image malformed.");

      try {
        await initializeDatabase(db);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.pragma).toHaveBeenCalledTimes(1);

      expect(db.pragma).toHaveBeenCalledWith({ command: "integrity_check" });
      for (const method of Object.keys(db))
        if (method !== "pragma")
          expect((db as any)[method]).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "DB_CORRUPTED:F_KEY_VIOLATION";

    it(`throws ewc '${errorCode}' if any table violates the foreign key constraint`, async () => {
      expect.assertions(1);

      // turning off this rule, so that I can commit some nasty sin down the road
      await database.pragma({ command: "foreign_keys = OFF" });

      // violating foreign key constraint manually
      await database.execute({
        sql: `create table parent(id integer primary key);
        create table child(x references parent(id));
        insert into child values (1);`,
      });

      try {
        await initializeDatabase(database);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  it(`creates all the tables defined in the TABLE_SCHEMAS object`, async () => {
    {
      const allTableNames = await getAllTableNames({
        db: database,
        preparedQueryName: "g_a_t_n",
      });
      expect(allTableNames).toEqual([]);
    }

    await initializeDatabase(database);

    {
      const allTableNames = await getAllTableNames({
        db: database,
        preparedQueryName: "g_a_t_n",
      });

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

      await database.execute({ sql: `create table ${unknownTableName} (x);` });

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
        await database.execute({ sql: `drop table ${deletedTableName}` });

        const allTableNames = await getAllTableNames({
          db: database,
          preparedQueryName: "x",
        });
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
