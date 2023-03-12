import type { Statement } from "better-sqlite3";

export type PreparedQueryStatements<
  Queries extends { readonly [k: string]: string }
> = Record<keyof Queries, Statement>;

export type GetMaxId = () => Promise<number>;
