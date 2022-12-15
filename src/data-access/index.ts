import {
  normalizeDocumentToRecord,
  normalizeRecordToDocument,
} from "./work-session-db/util";

import { makeGetMaxId } from "./util";
import { getConfig } from "src/config";
import { makeDbSubProcess } from "./db";
import { initializeDatabase } from "./init-db";
import buildProjectDatabase from "./project-db";
import SqliteDatabase from "./db/mainprocess-db";
import buildCategoryDatabase from "./category-db";
import buildWorkSessionDatabase from "./work-session-db";
import { setInitialId, setInitialId_Argument } from "./id";
import ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";

export interface AllDatabases {
  database: SqliteDatabase;
  project: ProjectDatabaseInterface;
  category: CategoryDatabaseInterface;
  workSession: WorkSessionDatabaseInterface;
}

export interface MakeAllDatabase_Argument {
  notifyDatabaseCorruption(arg: any): void;
}
export async function makeAllDatabase(
  builderArg: MakeAllDatabase_Argument
): Promise<AllDatabases> {
  const { notifyDatabaseCorruption } = builderArg;

  const config = getConfig();

  const database = new SqliteDatabase({
    makeDbSubProcess,
    sqliteDbPath: config.DB_PATH,
    dbCloseTimeoutMsWhenKilling: config.DB_CLOSE_TIMEOUT_WHEN_KILLING,
  });

  await database.open({ path: config.DB_PATH });

  await initializeDatabase(database);

  const commonArg = {
    db: database,
    makeGetMaxId,
    notifyDatabaseCorruption,
  };

  const allDatabases: AllDatabases = {
    database,
    project: buildProjectDatabase(commonArg),
    category: buildCategoryDatabase(commonArg),
    workSession: buildWorkSessionDatabase({
      ...commonArg,
      normalizeDocumentToRecord,
      normalizeRecordToDocument,
    }),
  };

  {
    const entityNameAndDbPairs: {
      entity: setInitialId_Argument["entity"];
      db: any;
    }[] = [
      { entity: "category", db: allDatabases.category },
      { entity: "project", db: allDatabases.project },
      { entity: "work-session", db: allDatabases.workSession },
    ];

    for (const { entity, db } of entityNameAndDbPairs) {
      const currentId = await db.getMaxId();
      setInitialId({ entity, currentId });
    }
  }

  setInitialId({
    entity: "category",
    currentId: await allDatabases.category.getMaxId(),
  });

  return Object.freeze(allDatabases);
}
