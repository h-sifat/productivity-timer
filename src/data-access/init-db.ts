import type SqliteDatabase from "./db/mainprocess-db";

import { tableSchemas } from "./schemas";
import { getDbConfig } from "src/config";

const dbConfig = getDbConfig();

// @TODO still have to do a lot of error handling and checking
// I'm just trying to set up the db to develop the categoryDb and ProjectsDb
export async function initializeDatabase(db: SqliteDatabase) {
  {
    const result = await db.pragma({ command: "integrity_check" });
    if (String(result).toLowerCase() !== "ok")
      throw new Error(`Database is corrupted: ${result}`);
  }

  for (const [pragma, value] of Object.entries(dbConfig.pragmas)) {
    await db.pragma({ command: `${pragma}=${value}` });
  }

  {
    const table = await db.pragma({ command: "foreign_key_check" });
    if (table)
      throw new Error(
        `Database is corrupted: foreign key constraint violated in table: "${table}"`
      );
  }

  await db.execute({ sql: tableSchemas.categories });
  await db.execute({ sql: tableSchemas.projects });
  await db.execute({ sql: tableSchemas.work_sessions });
}
