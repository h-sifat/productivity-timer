import makeProjectService from "use-cases/project";
import makeCategoryService from "use-cases/category";
import makeWorkSessionService from "use-cases/work-session";

import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";

export interface makeUseCases_Argument {
  databases: {
    project: ProjectDatabaseInterface;
    category: CategoryDatabaseInterface;
    workSession: WorkSessionDatabaseInterface;
  };
}

export function makeUseCases(factoryArg: makeUseCases_Argument) {
  const { databases } = factoryArg;

  const ProjectService = makeProjectService({ db: databases.project });
  const CategoryService = makeCategoryService({ database: databases.category });
  const WorkSessionService = makeWorkSessionService({
    db: databases.workSession,
  });

  return Object.freeze({
    ProjectService,
    CategoryService,
    WorkSessionService,
  } as const);
}
