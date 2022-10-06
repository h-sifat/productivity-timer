import EventEmitter from "events";
import EPP from "common/util/epp";

import type {
  Commands,
  DbSubProcess,
  MakeDbSubProcess,
  DbSubprocessCommands,
  DbSubprocessResponse,
  QueryMethodArguments as QueryArguments,
  QueryMethodReturnType as QueryReturnTypes,
} from "./interface";

interface SqliteDatabaseConstructorArgument {
  sqliteDbPath: string;
  makeDbSubProcess: MakeDbSubProcess;
  dbCloseTimeoutMsWhenKilling?: number;
}

const DB_KILLED_ERROR = new EPP({
  code: "DB_HAS_BEEN_KILLED",
  message: `Database instance has been killed manually.`,
});

const DB_SUBPROCESS_CRASHED_ERROR = new EPP({
  code: "DB_SUBPROCESS_CRASHED",
  message: `The sqlite database subprocess has crashed.`,
});

export default class SqliteDatabase extends EventEmitter {
  readonly #commandQueue: Commands[keyof Commands][] = [];

  #dbSubProcess: DbSubProcess;

  #isDbKilled = false;
  #isExecutingCommands = false;
  #isDbSubProcessRunning = false;

  readonly #dbCloseTimeoutMsWhenKilling: number;
  readonly #sqliteDbPath: SqliteDatabaseConstructorArgument["sqliteDbPath"];
  readonly #makeDbSubProcess: SqliteDatabaseConstructorArgument["makeDbSubProcess"];

  constructor(arg: SqliteDatabaseConstructorArgument) {
    super();

    this.#sqliteDbPath = arg.sqliteDbPath;
    this.#makeDbSubProcess = arg.makeDbSubProcess;
    this.#dbCloseTimeoutMsWhenKilling = arg.dbCloseTimeoutMsWhenKilling || 1000;

    this.#dbSubProcess = this.#makeDbSubProcess();
    this.#isDbSubProcessRunning = true;
    this.#registerSubProcessEventListeners();
  }

  #handleDbSubProcessResponse = (response: DbSubprocessResponse) => {
    if (this.#isDbKilled) return;

    const {
      reject,
      resolve,
      argument,
      name: methodName,
    } = this.#commandQueue.shift()!;

    // command execution failed
    if (response.error) {
      const { error } = response;

      reject(error);

      if (methodName === "open")
        this.emit("open_failed", { path: argument.path, error });
    } else {
      // command executed successfully
      resolve(response.result);

      if (methodName === "open") this.emit("open", { path: argument.path });
    }

    this.#resumeCommandsExecution();
  };

  #handleDbSubProcessCrash = (code: number | null, signal: string | null) => {
    this.#isDbSubProcessRunning = false;

    this.#removeAllDbSubProcessEventListeners();

    this.emit("db_subprocess:crashed", { code, signal });

    this.#rejectAllCommandsWith(DB_SUBPROCESS_CRASHED_ERROR);

    this.#reSpawnDbSubProcess();
  };

  #reSpawnDbSubProcess() {
    if (this.#isDbKilled) return;

    try {
      this.#dbSubProcess = this.#makeDbSubProcess();
      this.#isDbSubProcessRunning = true;

      this.#registerSubProcessEventListeners();

      this.#resumeCommandsExecution();

      // try to open the sqlite db in the newly created db sub_process
      this.open({ path: this.#sqliteDbPath })
        .catch(() => {})
        .finally(() => {
          this.emit("db_subprocess:re_spawned");
        });
    } catch (ex) {
      this.#isDbSubProcessRunning = false;
      this.emit("db_subprocess:re_spawn_failed", { error: ex });
    }
  }

  #registerSubProcessEventListeners() {
    this.#dbSubProcess.on("close", this.#handleDbSubProcessCrash);
    this.#dbSubProcess.on("message", this.#handleDbSubProcessResponse);
  }

  #removeAllDbSubProcessEventListeners() {
    this.#dbSubProcess.removeListener("close", this.#handleDbSubProcessCrash);
    this.#dbSubProcess.removeListener(
      "message",
      this.#handleDbSubProcessResponse
    );
  }

  #resumeCommandsExecution() {
    this.#isExecutingCommands = false;
    this.#executeCommands();
  }

  #executeCommands() {
    {
      const cannotExecuteCommand =
        this.#isDbKilled ||
        this.#isExecutingCommands ||
        !this.#commandQueue.length ||
        !this.#isDbSubProcessRunning;

      if (cannotExecuteCommand) return;
    }

    this.#isExecutingCommands = true;

    const { name: method, argument = undefined } = this.#commandQueue[0]!;
    this.#dbSubProcess.send({ method, argument } as DbSubprocessCommands);
  }

  #enqueueCommand<Command extends Commands[keyof Commands]>(arg: {
    name: Command["name"];
    argument: Command["argument"];
  }): QueryReturnTypes[Command["name"]] {
    // @ts-ignore
    if (this.#isDbKilled) return Promise.reject(DB_KILLED_ERROR);

    return new Promise((resolve, reject) => {
      const command = { ...arg, resolve, reject };
      this.#commandQueue.push(command as any);

      this.#executeCommands();
    }) as QueryReturnTypes[Command["name"]];
  }

  #rejectAllCommandsWith(error: any) {
    while (this.#commandQueue.length) {
      const { reject } = this.#commandQueue.shift()!;
      reject(error);
    }
  }

  kill(): Promise<void> {
    if (this.#isDbKilled) return Promise.resolve();

    return new Promise((resolve) => {
      // though we haven't killed the subprocess yet, but the flag
      // is necessary to stop any further query execution, enqueuing and
      // db subprocess re-spawning
      this.#isDbKilled = true;

      // remove all listeners so no incoming query response will be handled
      this.#removeAllDbSubProcessEventListeners();

      this.#rejectAllCommandsWith(DB_KILLED_ERROR);

      if (!this.#isDbSubProcessRunning) {
        resolve();
        return;
      }

      let killTimeoutId: any;

      const killDbIfItIsStillRunning = () => {
        clearTimeout(killTimeoutId);

        if (this.#isDbSubProcessRunning)
          try {
            this.#dbSubProcess.kill();
          } catch {}

        this.#isDbSubProcessRunning = false;

        resolve(); // now the db is killed and the promise will be resolved
        this.emit("kill");
      };

      // this listener will be called when the db.close() command is
      // finished executing
      this.#dbSubProcess.on("message", killDbIfItIsStillRunning);

      // if the close command takes more than this.#dbCloseTimeoutMsWhenKilling
      // milliseconds, then this timer will be called an will kill the
      // subprocess without waiting for the response of the close command.
      killTimeoutId = setTimeout(
        killDbIfItIsStillRunning,
        this.#dbCloseTimeoutMsWhenKilling
      );

      // close the opened sqlite db in the subprocess
      this.#dbSubProcess.send({ method: "close", argument: undefined });
    });
  }

  // Command Registers
  async open(arg: QueryArguments["open"]) {
    const { path } = arg;
    return this.#enqueueCommand<Commands["open"]>({
      name: "open",
      argument: { path },
    });
  }

  async isOpen() {
    return this.#enqueueCommand<Commands["isOpen"]>({
      name: "isOpen",
      argument: undefined,
    });
  }

  async close() {
    return this.#enqueueCommand<Commands["close"]>({
      name: "close",
      argument: undefined,
    });
  }

  async pragma(arg: QueryArguments["pragma"]) {
    const { command } = arg;
    return this.#enqueueCommand<Commands["pragma"]>({
      name: "pragma",
      argument: { command },
    });
  }

  async backup(arg: QueryArguments["backup"]) {
    const { destination } = arg;
    return this.#enqueueCommand<Commands["backup"]>({
      name: "backup",
      argument: { destination },
    });
  }

  async prepare(arg: QueryArguments["prepare"]) {
    const { statement, name } = arg;
    return this.#enqueueCommand<Commands["prepare"]>({
      name: "prepare",
      argument: { statement, name },
    });
  }

  async isPrepared(arg: QueryArguments["isPrepared"]) {
    const { name } = arg;
    return this.#enqueueCommand<Commands["isPrepared"]>({
      name: "isPrepared",
      argument: { name },
    });
  }

  async deletePrepared(arg: QueryArguments["isPrepared"]) {
    const { name } = arg;
    return this.#enqueueCommand<Commands["deletePrepared"]>({
      name: "deletePrepared",
      argument: { name },
    });
  }

  async executePrepared(arg: QueryArguments["executePrepared"]) {
    const { name, statementArgs = {} } = arg;

    return this.#enqueueCommand<Commands["executePrepared"]>({
      name: "executePrepared",
      argument: { name, statementArgs },
    });
  }

  async runPrepared(arg: QueryArguments["runPrepared"]) {
    const { name, statementArgs = {} } = arg;

    return this.#enqueueCommand<Commands["runPrepared"]>({
      name: "runPrepared",
      argument: { name, statementArgs },
    });
  }

  async execute(arg: QueryArguments["execute"]) {
    const { sql } = arg;
    return this.#enqueueCommand<Commands["execute"]>({
      name: "execute",
      argument: { sql },
    });
  }

  // getters and setters
  get isKilled() {
    return this.#isDbKilled;
  }
}
