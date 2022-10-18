export interface QueryMethodArguments {
  close: undefined;
  isOpen: undefined;
  open: { path: string };
  execute: { sql: string };
  pragma: { command: string };
  isPrepared: { name: string };
  backup: { destination: string };
  deletePrepared: { name: string };
  runPrepared: { name: string; statementArgs?: object };
  executePrepared: { name: string; statementArgs?: object };
  prepare: { name: string; statement: string; overrideIfExists?: boolean };
}

interface NonVoidReturnTypes {
  isOpen: Promise<boolean>;
  pragma: Promise<unknown>;
  isPrepared: Promise<boolean>;
  executePrepared: Promise<unknown[]>;
  runPrepared: Promise<{ changes: 1; lastInsertRowid: 1 }>;
}

export type QueryMethodReturnType = Record<
  keyof Omit<QueryMethodArguments, keyof NonVoidReturnTypes>,
  Promise<void>
> &
  NonVoidReturnTypes;

export enum CommandType {
  NORMAL = 1,
  TRANSACTIONAL,
  END_TRANSACTION,
  START_TRANSACTION,
}

Object.freeze(CommandType);

interface MakeCommand<Name extends keyof QueryMethodArguments, Argument> {
  name: Name;
  reject: Function;
  resolve: Function;
  type: CommandType;
  argument: Argument;
}

type MakeCommands<
  _QMA extends QueryMethodArguments,
  methods extends keyof QueryMethodArguments
> = {
  [method in methods]: MakeCommand<method, _QMA[method]>;
};

export type Commands = MakeCommands<
  QueryMethodArguments,
  keyof QueryMethodArguments
>;

export type Command = Commands[keyof Commands];

export interface DbSubprocessResponse {
  result: any;
  error: null | object;
}

type MakeCommandsForSubprocessDB<
  _QMA extends QueryMethodArguments,
  methods extends keyof QueryMethodArguments
> = {
  [method in methods]: { method: method; argument: _QMA[method] };
}[methods];

export type DbSubprocessCommands = MakeCommandsForSubprocessDB<
  QueryMethodArguments,
  keyof QueryMethodArguments
>;

export interface DbSubProcess {
  send(command: DbSubprocessCommands): void;
  kill(signal?: number | NodeJS.Signals | undefined): boolean;
  on(event: "message", callbacK: (arg: DbSubprocessResponse) => void): void;

  on(
    event: "close",
    callbacK: (code: number | null, signal: string | null) => void
  ): void;

  removeListener(event: "message" | "close", listener: Function): void;
}

export type MakeDbSubProcess = () => DbSubProcess;
