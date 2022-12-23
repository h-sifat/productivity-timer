import makeProjectService from "use-cases/project";
import makeCategoryService from "use-cases/category";
import makeWorkSessionService from "use-cases/work-session";

import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import type { CategoryDeleteSideEffect } from "use-cases/interfaces/category-service";

export interface makeServices_Argument {
  databases: {
    project: ProjectDatabaseInterface;
    category: CategoryDatabaseInterface;
    workSession: WorkSessionDatabaseInterface;
  };
  sideEffects: {
    category: {
      delete: CategoryDeleteSideEffect;
    };
  };
}

export function makeServices(factoryArg: makeServices_Argument) {
  const { databases, sideEffects } = factoryArg;

  const project = makeProjectService({ db: databases.project });
  const category = makeCategoryService({
    database: databases.category,
    deleteSideEffect: sideEffects.category.delete,
  });
  const workSession = makeWorkSessionService({
    db: databases.workSession,
  });

  return Object.freeze({ project, category, workSession } as const);
}
