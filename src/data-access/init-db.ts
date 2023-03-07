import type SqliteDatabase from "./db/mainprocess-db";

import EPP from "common/util/epp";
import { dbPragmas } from "src/config";
import { getAllTableNames } from "./util";
import { TABLE_SCHEMAS, TABLE_SCHEMA_ORDER, DB_INDICES } from "./schemas";

export const QUERY_NAME_GET_ALL_TBL_NAMES = "init/getAllTableNames";

export async function initializeDatabase(
  db: Pick<SqliteDatabase, "pragma" | "prepare" | "execute" | "executePrepared">
) {
  {
    const result = await db.pragma({ command: "integrity_check" });
    if (String(result).toLowerCase() !== "ok")
      throw new EPP({
        code: "DB_CORRUPTED:INTEGRITY_VIOLATION",
        message: `Database is corrupted. ${result}`,
      });
  }

  for (const [pragma, value] of Object.entries(dbPragmas)) {
    await db.pragma({ command: `${pragma}=${value}` });
  }

  {
    const table = await db.pragma({ command: "foreign_key_check" });
    if (table)
      throw new EPP({
        code: "DB_CORRUPTED:F_KEY_VIOLATION",
        message: `Database is corrupted. Foreign key constraint violation in table: "${table}"`,
      });
  }

  const existingTables = await getAllTableNames({
    db,
    preparedQueryName: QUERY_NAME_GET_ALL_TBL_NAMES,
  });

  if (!existingTables.length) {
    for (const table of TABLE_SCHEMA_ORDER)
      await db.execute({ sql: TABLE_SCHEMAS[table] });
  } else {
    for (const table of TABLE_SCHEMA_ORDER)
      if (!existingTables.includes(table))
        throw new EPP({
          code: "DB_CORRUPTED:TABLE_DELETED",
          message: `Database is corrupted. The table "${table}" has been deleted.`,
        });

    for (const table of existingTables)
      if (!(table in TABLE_SCHEMAS))
        throw new EPP({
          code: "DB_CORRUPTED:UNKNOWN_TABLE",
          message: `Database is corrupted. Unknown table ("${table}").`,
        });
  }

  Object.values(DB_INDICES).forEach(async (indexSql) => {
    db.execute({ sql: indexSql });
  });
}
