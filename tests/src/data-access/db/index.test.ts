import fs from "fs";
import path from "path";
import EventEmitter from "events";
import SqliteDatabase from "src/date-access/db";
import { ChildProcess, fork } from "child_process";
import { Commands, MakeDbSubProcess } from "src/date-access/db/interface";

class FakeDbSubProcess extends EventEmitter {
  isKilled = false;
  commands: Commands[] = [];

  send(command: Commands) {
    this.commands.push(command);
    this.emit("command", command);
  }

  kill(code: number | null = null, signal: string | null = "SIGTERM") {
    this.isKilled = true;
    this.emit("close", code, signal);
  }
}

const sqliteDbSubprocessModulePath = path.join(
  process.cwd(), // the cwd has to be the root of this project
  "src/date-access/db/db-subprocess.js"
);

// TIP: change {stdio: "ignore"} to {stdio: "inherit"} to see error logs
// from the subprocess.
const makeDbSubProcess: MakeDbSubProcess = () =>
  fork(sqliteDbSubprocessModulePath, { stdio: "inherit" });

let globalDb: SqliteDatabase;
const IN_MEMORY_DB_PATH = ":memory:";

beforeEach(async () => {
  globalDb = new SqliteDatabase({
    makeDbSubProcess,
    sqliteDbPath: IN_MEMORY_DB_PATH,
  });
  await globalDb.open({ path: IN_MEMORY_DB_PATH });
});

afterEach(async () => {
  await globalDb.kill();
});

describe("open", () => {
  it(`throws error if db path does not exist`, async () => {
    expect.assertions(3);

    await globalDb.close();
    expect(await globalDb.isOpen()).toBeFalsy();

    const path = "/duck/says/quack.db";
    expect(fs.existsSync(path)).toBeFalsy();

    try {
      await globalDb.open({ path });
    } catch (ex) {
      expect(ex.message).toMatch(/.*not.*exist.*/);
    }
  });

  it(`Database.isOpen is true if database opens successfully`, async () => {
    const localDb = new SqliteDatabase({
      makeDbSubProcess,
      sqliteDbPath: IN_MEMORY_DB_PATH,
    });

    expect(await localDb.isOpen()).toBeFalsy();

    await localDb.open({ path: IN_MEMORY_DB_PATH });

    expect(await localDb.isOpen()).toBeTruthy();

    await localDb.kill();
  });

  {
    const errorCode = "DB_IS_ALREADY_OPEN";

    it(`throws ewc "${errorCode}" if the open method is called on a opened db`, async () => {
      expect.assertions(2);

      expect(await globalDb.isOpen()).toBeTruthy();

      try {
        await globalDb.open({ path: IN_MEMORY_DB_PATH });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const openFailedEvent = "open_failed";
    it(`emits the "${openFailedEvent}" if the db cannot be opened`, (done) => {
      globalDb.on(openFailedEvent, ({ path, error }) => {
        try {
          expect(path).toBe(IN_MEMORY_DB_PATH);
          expect(error.code).toBe("DB_IS_ALREADY_OPEN");
          done();
        } catch (ex) {
          done(ex);
        }
      });

      // db is already open so it should throw an error
      globalDb.open({ path: IN_MEMORY_DB_PATH }).catch(() => {});
    });
  }

  {
    const openEvent = "open";
    it(`emits the "${openEvent}" event when a database is opened`, (done) => {
      const localDb = new SqliteDatabase({
        makeDbSubProcess,
        sqliteDbPath: IN_MEMORY_DB_PATH,
      });

      localDb.on(openEvent, async (arg) => {
        try {
          expect(arg).toEqual({ path: IN_MEMORY_DB_PATH });

          await localDb.kill();

          done();
        } catch (ex) {
          done(ex);
        }
      });

      localDb.open({ path: IN_MEMORY_DB_PATH });
    });
  }
});

describe("close", () => {
  it(`closes a database`, async () => {
    expect(await globalDb.isOpen()).toBeTruthy();

    await globalDb.close();
    expect(await globalDb.isOpen()).toBeFalsy();
  });

  it(`while closing the db it deletes any prepared statements`, async () => {
    const name = "systemCatalog";
    const statement = "select * from sqlite_master;";

    await globalDb.prepare({ statement, name });
    expect(await globalDb.isPrepared({ name })).toBeTruthy();

    await globalDb.close();
    expect(await globalDb.isOpen()).toBeFalsy();

    await globalDb.open({ path: IN_MEMORY_DB_PATH });
    expect(await globalDb.isOpen()).toBeTruthy();

    expect(await globalDb.isPrepared({ name })).toBeFalsy();
  });
});

describe("pragma", () => {
  it(`executes a pragma and returns the result`, async () => {
    const encoding = await globalDb.pragma({ command: "encoding" });
    expect(encoding).toBe("UTF-8");
  });

  it(`throws error if pragma command is invalid`, async () => {
    expect.assertions(1);

    try {
      await globalDb.pragma({ command: "duck/says/Quack?_not_valid_pragma!" });
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });
});

describe("prepare, isPrepared, and deletePrepared", () => {
  it(`prepares an sql statement`, async () => {
    const name = "systemCatalog";
    const statement = "select * from sqlite_master;";

    expect(await globalDb.isPrepared({ name })).toBeFalsy();

    await globalDb.prepare({ statement, name });
    expect(await globalDb.isPrepared({ name })).toBeTruthy();

    await globalDb.deletePrepared({ name });
    expect(await globalDb.isPrepared({ name })).toBeFalsy();
  });

  {
    const errorCode = "SQLITE_ERROR";

    it(`throws ewc "${errorCode}" if statement is not valid`, async () => {
      expect.assertions(2);

      const name = "invalid";
      const statement = "select * from;";

      try {
        await globalDb.prepare({ name, statement });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      expect(await globalDb.isPrepared({ name })).toBeFalsy();
    });
  }
});

describe("executePrepared", () => {
  {
    const errorCode = "STMT_DOES_NOT_EXIST";
    it(`throws ewc "${errorCode}" if no prepared statement exists with the given name`, async () => {
      expect.assertions(2);

      const name = "systemCatalog";
      expect(await globalDb.isPrepared({ name })).toBeFalsy();

      try {
        await globalDb.executePrepared({ name });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  it(`executes a prepared statement`, async () => {
    const name = "test";
    const statement = "select 3 as value";

    await globalDb.prepare({ name, statement });

    const result = await globalDb.executePrepared({ name });

    expect(result).toEqual([{ value: 3 }]);
  });
});

describe("runPrepared", () => {
  {
    const errorCode = "STMT_DOES_NOT_EXIST";
    it(`throws ewc "${errorCode}" if no prepared statement exists with the given name`, async () => {
      expect.assertions(2);

      const name = "systemCatalog";
      expect(await globalDb.isPrepared({ name })).toBeFalsy();

      try {
        await globalDb.runPrepared({ name });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  it(`runs a prepared command`, async () => {
    await globalDb.execute({
      sql: `create table users(v unique);`,
    });

    const name = "insert";

    await globalDb.prepare({
      statement: "insert into users values ('alex');",
      name,
    });

    const result = await globalDb.runPrepared({ name });
    expect(result).toEqual({ changes: 1, lastInsertRowid: 1 });
  });

  it(`throws error if statement can't be executed`, async () => {
    const username = "duck";

    await globalDb.execute({
      sql: `create table users(v unique); insert into users values ('${username}');`,
    });

    const name = "test";
    const statement = "insert into users values ($username)";
    await globalDb.prepare({ name, statement });

    try {
      // the value username: 'duck' for unique 'v' already exists
      await globalDb.runPrepared({ name, statementArgs: { username } });
    } catch (ex) {
      expect(ex.code).toBe("SQLITE_CONSTRAINT_UNIQUE");
    }
  });
});

describe("execute", () => {
  it(`it executes the given sql`, async () => {
    const tableName = "my_table";
    const sql = `create table ${tableName}(v);`;

    await globalDb.execute({ sql });

    const name = "test";
    const statement = `select name from sqlite_master;`;

    await globalDb.prepare({ name, statement });

    const result = await globalDb.executePrepared({ name });
    expect(result).toEqual([{ name: tableName }]);
  });

  it(`throws error if any error is encountered while executing the given sql`, async () => {
    expect.assertions(1);

    try {
      await globalDb.execute({ sql: "not_valid_sql;" });
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });
});

describe("backup", () => {
  // the cwd has the be the root of this project
  let backupDir: string;

  beforeEach(() => {
    // when the test is running the cwd should be the project root
    const prefix = path.join(process.cwd(), "./trash/backup-");
    backupDir = fs.mkdtempSync(prefix);
  });

  afterEach(() => {
    fs.rmSync(backupDir, { force: true, recursive: true });
  });

  it(`throws error if directory doesn't exist`, async () => {
    const backupDir = "/duck/says/quack";
    expect(fs.existsSync(backupDir)).toBeFalsy();

    const nonExistingDestination = path.join(backupDir, "backup.db");

    try {
      await globalDb.backup({ destination: nonExistingDestination });
    } catch (ex) {
      expect(ex.message).toEqual(expect.any(String));
    }
  });

  it(`backs up a db`, async () => {
    const tableName = "my_table";

    await globalDb.execute({
      sql: `create table ${tableName} (x); insert into ${tableName} values (1), (2), (3);`,
    });

    const name = "getCount";
    const statement = `select count(*) as count from ${tableName}`;
    const statementResult = [Object.freeze({ count: 3 })];

    await globalDb.prepare({ name, statement });

    {
      const result = await globalDb.executePrepared({ name });
      expect(result).toEqual(statementResult);
    }

    const backupDestination = path.join(backupDir, "backup.db");

    await globalDb.backup({ destination: backupDestination });

    await globalDb.close();

    // open the backed up db
    await globalDb.open({ path: backupDestination });

    await globalDb.prepare({ name, statement });

    {
      const result = await globalDb.executePrepared({ name });
      expect(result).toEqual(statementResult);
    }
  });
});

describe("Other", () => {
  const errorCode = "DB_NOT_INITIALIZED";

  it.each([
    { command: "close", arg: undefined },
    { command: "execute", arg: { sql: "select 2;" } },
    { command: "isPrepared", arg: { name: "getAll" } },
    { command: "pragma", arg: { command: "encoding" } },
    { command: "runPrepared", arg: { name: "getAll" } },
    { command: "deletePrepared", arg: { name: "getAll" } },
    { command: "executePrepared", arg: { name: "getAll" } },
    { command: "backup", arg: { destination: "/tmp/backup" } },
    { command: "prepare", arg: { name: "getAll", statement: "select *" } },
  ] as const)(
    `The "$command" command cannot be executed if db is not initialized`,
    async ({ command, arg }) => {
      expect.assertions(2);

      await globalDb.close();
      expect(await globalDb.isOpen()).toBeFalsy();

      try {
        // @ts-ignore
        await globalDb[command](arg);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    }
  );
});

describe("kill", () => {
  let localDb: SqliteDatabase;
  beforeEach(() => {
    localDb = new SqliteDatabase({
      makeDbSubProcess,
      sqliteDbPath: IN_MEMORY_DB_PATH,
    });
  });

  afterEach(async () => {
    await localDb.kill();
  });

  it(`kills a new and unopened database and emits the kill event`, (done) => {
    localDb.on("kill", () => {
      try {
        expect(localDb.isKilled).toBeTruthy();
        done();
      } catch (ex) {
        done(ex);
      }
    });

    expect(localDb.kill()).toBeInstanceOf(Promise);
  });

  {
    const errorCode = "DB_HAS_BEEN_KILLED";
    it(`throws ewc "${errorCode}" if any command is issued after killing the db`, async () => {
      expect.assertions(2);
      await localDb.open({ path: IN_MEMORY_DB_PATH });

      await localDb.kill();
      expect(localDb.isKilled).toBeTruthy();

      try {
        await localDb.prepare({ name: "stmt", statement: "select 2;" });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  it(`rejects all enqueued commands before killing the db`, (done) => {
    const fakeDbSubProcess = new FakeDbSubProcess();
    expect(fakeDbSubProcess.isKilled).toBeFalsy();
    expect(fakeDbSubProcess.commands).toHaveLength(0);

    const testDb = new SqliteDatabase({
      sqliteDbPath: IN_MEMORY_DB_PATH,
      makeDbSubProcess: () => <any>fakeDbSubProcess,
    });

    fakeDbSubProcess.on("command", () => {
      // ignore the first command (open) that will be issued below, so the
      // command would not get resolved.
      if (fakeDbSubProcess.commands.length === 1) return;

      fakeDbSubProcess.emit("message", { error: null, result: undefined });
    });

    // this promise will be rejected after the testDb.kill method is finished
    // executing.
    testDb.open({ path: IN_MEMORY_DB_PATH }).catch((error) => {
      try {
        expect(error.code).toBe("DB_HAS_BEEN_KILLED");

        expect(testDb.isKilled).toBeTruthy();
        expect(fakeDbSubProcess.isKilled).toBeTruthy();
        expect(fakeDbSubProcess.commands).toHaveLength(2); // "open" and "close" (before killing)
        done();
      } catch (ex) {
        done(ex);
      }
    });

    testDb.kill();
  });

  it(`waits "dbCloseTimeoutMsWhenKilling" ms for the response of the close command before killing the subprocess`, async () => {
    const fakeDbSubProcess = new FakeDbSubProcess();

    const dbCloseTimeoutMsWhenKilling = 10;
    const testDb = new SqliteDatabase({
      sqliteDbPath: IN_MEMORY_DB_PATH,
      dbCloseTimeoutMsWhenKilling,
      makeDbSubProcess: () => <any>fakeDbSubProcess,
    });

    /*
     * we won't be responding to any command that will be sent to the
     * fakeDbSubProcess, so it should not stop the kill method from killing the
     * sub process. It should kill the sub process after the given timeout
     * without waiting for the response of the "close" method from the sub
     * process
     * */

    await testDb.kill();

    expect(testDb.isKilled).toBeTruthy();
    expect(fakeDbSubProcess.commands).toHaveLength(1); // the "close" command
  });
});

describe("Handling SubProcess Crash", () => {
  {
    const event = "db_subprocess:crashed";
    it(`emits the "${event}" if the db sub_process crashes`, (done) => {
      const mockMakeDbSubProcess = jest
        .fn()
        .mockImplementation(() => makeDbSubProcess());

      const testDb = new SqliteDatabase({
        sqliteDbPath: IN_MEMORY_DB_PATH,
        makeDbSubProcess: mockMakeDbSubProcess,
      });

      testDb.on(event, async (arg) => {
        try {
          expect(arg).toHaveProperty("code");
          expect(arg).toHaveProperty("signal");

          await testDb.kill();

          done();
        } catch (ex) {
          done(ex);
        }
      });

      const currentlyActiveSubProcess =
        mockMakeDbSubProcess.mock.results[0].value;

      // simulating db sub_process crash
      currentlyActiveSubProcess.kill();
    });
  }

  {
    const errorCode = "DB_SUBPROCESS_CRASHED";
    it(`rejects all existing queries with ewc "${errorCode}" if the sub process crashes`, (done) => {
      const mockMakeDbSubProcess = jest
        .fn()
        .mockImplementation(() => makeDbSubProcess());

      const testDb = new SqliteDatabase({
        sqliteDbPath: IN_MEMORY_DB_PATH,
        makeDbSubProcess: mockMakeDbSubProcess,
      });

      testDb.isOpen().catch(async (error) => {
        try {
          expect(error.code).toBe(errorCode);
          await testDb.kill();

          done();
        } catch (ex) {
          done(ex);
        }
      });

      const currentlyActiveSubProcess =
        mockMakeDbSubProcess.mock.results[0].value;

      // simulating db sub_process crash
      currentlyActiveSubProcess.kill();
    });
  }

  {
    const reSpawnEvent = "db_subprocess:re_spawned";
    it(`tries to re-spawn the subprocess and open the db (from sqliteDbPath) after crash, if successful, emits the "${reSpawnEvent}" event`, (done) => {
      const mockMakeDbSubProcess = jest
        .fn()
        .mockImplementation(() => makeDbSubProcess());

      const testDb = new SqliteDatabase({
        sqliteDbPath: IN_MEMORY_DB_PATH,
        makeDbSubProcess: mockMakeDbSubProcess,
      });

      // currently our db is not open because we haven't called the
      // testDb yet.

      testDb.on(reSpawnEvent, async () => {
        try {
          // it means, a new subprocess was generated with
          // the mockMakeDbSubProcess function
          expect(mockMakeDbSubProcess.mock.results).toHaveLength(2);

          expect(await testDb.isOpen()).toBeTruthy();
          await testDb.kill();

          done();
        } catch (ex) {
          done(ex);
        }
      });

      expect(mockMakeDbSubProcess.mock.results).toHaveLength(1);

      const currentlyActiveSubProcess =
        mockMakeDbSubProcess.mock.results[0].value;
      expect(currentlyActiveSubProcess).toBeInstanceOf(ChildProcess);

      // simulating the sub process crash event
      currentlyActiveSubProcess.kill();
    });
  }

  {
    const event = "db_subprocess:re_spawn_failed";
    it(`emits the "${event}" if the db sub process re-spawning fails`, (done) => {
      const SPAWNING_SUB_PROCESS_FAILED_ERROR = new Error(
        `Computer said: "I'm tired of executing your crap."`
      );
      const mockMakeDbSubProcess = jest
        .fn()
        .mockImplementationOnce(() => new FakeDbSubProcess())
        .mockImplementationOnce(() => {
          throw SPAWNING_SUB_PROCESS_FAILED_ERROR;
        });

      const testDb = new SqliteDatabase({
        sqliteDbPath: IN_MEMORY_DB_PATH,
        makeDbSubProcess: mockMakeDbSubProcess,
      });

      testDb.on(event, async (arg) => {
        try {
          expect(arg.error).toBe(SPAWNING_SUB_PROCESS_FAILED_ERROR);
          await testDb.kill();

          done();
        } catch (ex) {
          done(ex);
        }
      });

      const currentlyActiveSubProcess =
        mockMakeDbSubProcess.mock.results[0].value;

      // simulating the sub process crash event
      currentlyActiveSubProcess.kill();
    });
  }
});
