import makeProjectService from "use-cases/project";
import makeCategoryService from "use-cases/category";
import makeWorkSessionService from "use-cases/work-session";
import { makeMetaInformationService } from "use-cases/meta";

import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { ProjectDeleteSideEffect } from "use-cases/interfaces/project-service";
import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import type { CategoryDeleteSideEffect } from "use-cases/interfaces/category-service";
import type { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-db";

export interface makeServices_Argument {
  databases: {
    project: ProjectDatabaseInterface;
    category: CategoryDatabaseInterface;
    workSession: WorkSessionDatabaseInterface;
    metaInfo: MetaInformationDatabaseInterface;
  };
  sideEffects: {
    category: {
      delete: CategoryDeleteSideEffect;
    };
    project: {
      delete: ProjectDeleteSideEffect;
    };
  };
}

export function makeServices(factoryArg: makeServices_Argument) {
  const { databases, sideEffects } = factoryArg;

  const project = makeProjectService({
    db: databases.project,
    deleteSideEffect: sideEffects.project.delete,
  });
  const category = makeCategoryService({
    database: databases.category,
    deleteSideEffect: sideEffects.category.delete,
  });
  const workSession = makeWorkSessionService({
    db: databases.workSession,
  });
  const metaInfo = makeMetaInformationService({ db: databases.metaInfo });

  return Object.freeze({ project, category, workSession, metaInfo } as const);
}
