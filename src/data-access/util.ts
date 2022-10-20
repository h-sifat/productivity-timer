import EPP from "common/util/epp";
import { MakeGetMaxId_Argument } from "./interface";

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

export function makeGetMaxId(builderArg: MakeGetMaxId_Argument) {
  const { db, maxIdColumnName, preparedQueryName, preparedQueryStatement } =
    builderArg;

  return async function getMaxId(): Promise<number> {
    await db.prepare({
      overrideIfExists: false,
      name: preparedQueryName,
      statement: preparedQueryStatement,
    });

    const result = (await db.executePrepared({
      name: preparedQueryName,
    })) as any;

    // result should be [ { [maxIdColumnName]: maxId } ]
    const maxId = result[0][maxIdColumnName];

    return Number(maxId) || 1;
  };
}
