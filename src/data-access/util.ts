import EPP from "common/util/epp";
import type { GetMaxId } from "./interface";
import type { Database as SqliteDatabase, Statement } from "better-sqlite3";

interface MakeProcessSingleValueReturningQueryResult_Argument {
  tableName: string;
  validate(arg: any): void;
  normalize(arg: any): void;
  notifyDatabaseCorruption(arg: any): void;
}

export function makeProcessSingleValueReturningQueryResult<DocType>(
  builderArg: MakeProcessSingleValueReturningQueryResult_Argument
) {
  const { validate, normalize, tableName, notifyDatabaseCorruption } =
    builderArg;

  interface function_Argument {
    result: any;
    multipleRecordsErrorMessage: string;
  }
  return function processSingleValueReturningQueryResult(
    arg: function_Argument
  ): null | DocType {
    const { result, multipleRecordsErrorMessage } = arg;
    if (!result.length) return null;

    if (result.length !== 1) {
      notifyDatabaseCorruption({
        table: tableName,
        otherInfo: { result },
        message: multipleRecordsErrorMessage,
      });

      throw new EPP({
        code: "DB_CORRUPTED",
        message: multipleRecordsErrorMessage,
      });
    }

    const document = result[0];

    normalize(document);
    validate(document);

    return document;
  };
}

export interface MakeGetMaxId_Argument {
  tableName: string;
  db: SqliteDatabase;
  idFieldName: string;
}

export function makeGetMaxId(factoryArg: MakeGetMaxId_Argument): GetMaxId {
  const { db, tableName, idFieldName } = factoryArg;

  const statement = db.prepare(
    `select ifnull(max(${idFieldName}), 0) as max_id from ${tableName};`
  );

  return function getMaxId() {
    return statement.all()[0].max_id;
  };
}

export function prepareQueries<
  Queries extends { readonly [k: string]: string }
>(arg: {
  queries: Queries;
  db: SqliteDatabase;
}): Readonly<Record<keyof Queries, Statement>> {
  const { db, queries } = arg;

  return Object.entries(queries)
    .map(([name, query]) => [name, db.prepare(query)])
    .reduce((obj, [name, statement]) => {
      obj[<string>name] = statement;
      return obj;
    }, {} as any);
}

export function asyncifyDatabaseMethods(db: {
  [k: string]: (...args: any[]) => any;
}): any {
  return Object.entries(db)
    .map(([name, method]) => [name, async (...args: any[]) => method(...args)])
    .reduce((obj, [name, method]) => {
      obj[<string>name] = method;
      return obj;
    }, {} as any);
}

export function getAllTableNames(arg: { db: SqliteDatabase }) {
  const { db } = arg;

  const getAllTableNamesStatement = db.prepare(
    `select name from sqlite_master where type = 'table';`
  );

  return getAllTableNamesStatement.all().map(({ name }) => name) as string[];
}
