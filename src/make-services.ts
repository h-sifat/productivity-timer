import makeProjectService from "use-cases/project";
import makeCategoryService from "use-cases/category";
import makeWorkSessionService from "use-cases/work-session";

import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";

export interface makeServices_Argument {
  databases: {
    project: ProjectDatabaseInterface;
    category: CategoryDatabaseInterface;
    workSession: WorkSessionDatabaseInterface;
  };
}

export function makeServices(factoryArg: makeServices_Argument) {
  const { databases } = factoryArg;

  const project = makeProjectService({ db: databases.project });
  const category = makeCategoryService({ database: databases.category });
  const workSession = makeWorkSessionService({
    db: databases.workSession,
  });

  return Object.freeze({ project, category, workSession } as const);
}
