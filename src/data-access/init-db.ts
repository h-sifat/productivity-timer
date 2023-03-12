import EPP from "common/util/epp";
import { dbPragmas } from "src/config";
import { getAllTableNames } from "./util";
import type { Database as SqliteDatabase } from "better-sqlite3";
import { TABLE_SCHEMAS, TABLE_SCHEMA_ORDER, DB_INDICES } from "./schemas";

export const QUERY_NAME_GET_ALL_TBL_NAMES = "init/getAllTableNames";

export async function initializeDatabase(db: SqliteDatabase) {
  {
    const result = await db.pragma("integrity_check", { simple: true });
    if (String(result).toLowerCase() !== "ok")
      throw new EPP({
        code: "DB_CORRUPTED:INTEGRITY_VIOLATION",
        message: `Database is corrupted. ${result}`,
      });
  }

  for (const [pragma, value] of Object.entries(dbPragmas))
    await db.pragma(`${pragma}=${value}`);

  {
    const table = await db.pragma("foreign_key_check", { simple: true });
    if (table)
      throw new EPP({
        code: "DB_CORRUPTED:F_KEY_VIOLATION",
        message: `Database is corrupted. Foreign key constraint violation in table: "${table}"`,
      });
  }

  const existingTables = getAllTableNames({ db });

  if (!existingTables.length) {
    for (const table of TABLE_SCHEMA_ORDER) db.exec(TABLE_SCHEMAS[table]);
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
    db.exec(indexSql);
  });
}
