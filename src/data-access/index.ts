import {
  normalizeDocumentToRecord,
  normalizeRecordToDocument,
} from "./work-session-db/util";

import { makeGetMaxId } from "./util";
import { getConfig } from "src/config";
import { initializeDatabase } from "./init-db";
import buildProjectDatabase from "./project-db";
import buildCategoryDatabase from "./category-db";
import buildWorkSessionDatabase from "./work-session-db";
import { setInitialId, setInitialId_Argument } from "./id";

import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import type { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-db";
import { buildMetaInfoDatabase } from "./meta-db";
import Database from "better-sqlite3";

export interface AllDatabases {
  internalDatabase: Database.Database;
  project: ProjectDatabaseInterface;
  category: CategoryDatabaseInterface;
  workSession: WorkSessionDatabaseInterface;
  metaInfo: MetaInformationDatabaseInterface;
}

export interface MakeAllDatabase_Argument {
  notifyDatabaseCorruption(arg: any): void;
}
export async function makeAllDatabase(
  builderArg: MakeAllDatabase_Argument
): Promise<AllDatabases> {
  const { notifyDatabaseCorruption } = builderArg;

  const config = getConfig();

  const database = new Database(config.DB_PATH, { fileMustExist: true });

  await initializeDatabase(database);

  const commonArg = {
    db: database,
    makeGetMaxId,
    notifyDatabaseCorruption,
  };

  const allDatabases: AllDatabases = {
    internalDatabase: database,
    project: buildProjectDatabase(commonArg),
    category: buildCategoryDatabase(commonArg),
    metaInfo: buildMetaInfoDatabase(commonArg),
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
