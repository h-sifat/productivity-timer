import EventEmitter from "events";
import EPP from "common/util/epp";

import {
  Command,
  Commands,
  CommandType,
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
  readonly #normalCommandQueue: Command[] = [];
  readonly #transactionCommandQueue: Command[] = [];

  #dbSubProcess: DbSubProcess;

  #isDbKilled = false;
  #isExecutingCommands = false;
  #isDbSubProcessRunning = false;
  #transaction: Transaction | null = null;

  readonly #END_TRANSACTION_FLAG = Symbol();

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
      type,
      reject,
      resolve,
      argument,
      name: methodName,
    } = this.#getCommandQueue().shift()!;

    // command execution failed
    if (response.error) {
      const { error } = response;

      reject(error);

      if (methodName === "open")
        this.emit("open_failed", { path: argument.path, error });
    } else {
      // command executed successfully
      switch (type) {
        case CommandType.START_TRANSACTION:
          this.#startTransaction();
          resolve(this.#transaction);
          break;

        case CommandType.END_TRANSACTION:
          this.#stopTransaction();
          resolve(response.result);
          break;

        default:
          resolve(response.result);
      }

      if (methodName === "open") this.emit("open", { path: argument.path });
    }

    this.#resumeCommandsExecution();
  };

  #startTransaction() {
    this.#transaction = new Transaction({
      enqueueCommand: this.#enqueueCommand,
      END_TRANSACTION_FLAG: this.#END_TRANSACTION_FLAG,
    });
  }

  #stopTransaction() {
    if (this.#transaction) this.#transaction[this.#END_TRANSACTION_FLAG]();
    this.#transaction = null;
  }

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
      // this.#dbSubProcess.send({method: "open", argument: {path: this.#sqliteDbPath}})
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

  #getCommandQueue(): Command[] {
    return this.#transaction
      ? this.#transactionCommandQueue
      : this.#normalCommandQueue;
  }

  #peekFirstCommand(): Command | undefined {
    return this.#getCommandQueue()[0];
  }

  #executeCommands() {
    {
      const cannotExecuteCommand =
        this.#isDbKilled ||
        this.#isExecutingCommands ||
        !this.#getCommandQueue().length ||
        !this.#isDbSubProcessRunning;

      if (cannotExecuteCommand) return;
    }

    this.#isExecutingCommands = true;

    const { name: method, argument = undefined } = this.#peekFirstCommand()!;
    this.#dbSubProcess.send({ method, argument } as DbSubprocessCommands);
  }

  #enqueueCommand = <Command extends Commands[keyof Commands]>(arg: {
    type?: CommandType;
    name: Command["name"];
    argument: Command["argument"];
  }): QueryReturnTypes[Command["name"]] => {
    // @ts-ignore
    if (this.#isDbKilled) return Promise.reject(DB_KILLED_ERROR);

    return new Promise((resolve, reject) => {
      const { type = CommandType.NORMAL, name, argument } = arg;

      const command = Object.freeze({
        name,
        type,
        reject,
        resolve,
        argument: Object.freeze(argument),
      });

      switch (type) {
        case CommandType.NORMAL:
        case CommandType.START_TRANSACTION:
          this.#normalCommandQueue.push(command as any);
          break;

        case CommandType.TRANSACTIONAL:
        case CommandType.END_TRANSACTION:
          this.#transactionCommandQueue.push(command as any);
          break;

        default:
          throw new EPP({
            code: "INVALID_COMMAND_TYPE",
            message: `Invalid command type: "${CommandType[type]}"`,
          });
      }

      this.#executeCommands();
    }) as QueryReturnTypes[Command["name"]];
  };

  #rejectAllCommandsWith(error: any) {
    this.#stopTransaction();

    while (this.#transactionCommandQueue.length) {
      const { reject } = this.#transactionCommandQueue.shift()!;
      reject(error);
    }

    while (this.#normalCommandQueue.length) {
      const { reject } = this.#normalCommandQueue.shift()!;
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
      // milliseconds, then this timer will be called and will kill the
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
    const { statement, name, overrideIfExists = true } = arg;
    return this.#enqueueCommand<Commands["prepare"]>({
      name: "prepare",
      argument: { statement, name, overrideIfExists },
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

  async startTransaction(
    type?: "immediate" | "exclusive" | "deferred"
  ): Promise<Transaction> {
    return this.#enqueueCommand<any>({
      name: "execute",
      type: CommandType.START_TRANSACTION,
      argument: { sql: `begin ${type || ""};` },
    });
  }

  // getters and setters
  get isKilled() {
    return this.#isDbKilled;
  }
}

interface Transaction_Argument {
  enqueueCommand<Command extends Commands[keyof Commands]>(arg: {
    name: Command["name"];
    argument: Command["argument"];
    type?: CommandType;
  }): QueryReturnTypes[Command["name"]];
  END_TRANSACTION_FLAG: symbol;
}

class Transaction {
  [key: string | symbol]: any;

  #isTransactionRunning = true;
  readonly #__enqueueCommand__: Transaction_Argument["enqueueCommand"];

  constructor(arg: Transaction_Argument) {
    this.#__enqueueCommand__ = arg.enqueueCommand;

    this[arg.END_TRANSACTION_FLAG] = () => {
      this.#isTransactionRunning = false;
    };
  }

  #enqueueCommand: Transaction_Argument["enqueueCommand"] = (arg: any) => {
    if (!this.#isTransactionRunning)
      throw new EPP({
        code: "TRANSACTION_OVER",
        message: `This transaction is already over.`,
      });

    return this.#__enqueueCommand__(arg);
  };

  async executePrepared(arg: QueryArguments["executePrepared"]) {
    const { name, statementArgs = {} } = arg;

    return this.#enqueueCommand<Commands["executePrepared"]>({
      name: "executePrepared",
      argument: { name, statementArgs },
      type: CommandType.TRANSACTIONAL,
    });
  }

  async runPrepared(arg: QueryArguments["runPrepared"]) {
    const { name, statementArgs = {} } = arg;

    return this.#enqueueCommand<Commands["runPrepared"]>({
      name: "runPrepared",
      argument: { name, statementArgs },
      type: CommandType.TRANSACTIONAL,
    });
  }

  async execute(arg: QueryArguments["execute"]) {
    const { sql } = arg;
    return this.#enqueueCommand<Commands["execute"]>({
      name: "execute",
      argument: { sql },
      type: CommandType.TRANSACTIONAL,
    });
  }

  async end(command: "commit" | "rollback") {
    const promise = this.#enqueueCommand<any>({
      name: "execute",
      argument: { sql: command + ";" },
      type: CommandType.END_TRANSACTION,
    });

    this.#isTransactionRunning = false;

    return promise;
  }
}
