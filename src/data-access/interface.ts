import type SqliteDatabase from "./db/mainprocess-db";

export interface MakeGetMaxId_Argument {
  maxIdColumnName: string;
  preparedQueryName: string;
  preparedQueryStatement: string;
  db: Pick<SqliteDatabase, "prepare" | "executePrepared">;
}

export type GetMaxId = () => Promise<number>;
export type MakeGetMaxId = (arg: MakeGetMaxId_Argument) => GetMaxId;
