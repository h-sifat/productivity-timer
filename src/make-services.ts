import makeProjectService from "use-cases/project";
import makeCategoryService from "use-cases/category";
import makeWorkSessionService from "use-cases/work-session";
import { makeMetaInformationService } from "use-cases/meta";

import type {
  ProjectAddSideEffect,
  ProjectEditSideEffect,
  ProjectDeleteSideEffect,
} from "use-cases/interfaces/project-service";
import type {
  CategoryAddSideEffect,
  CategoryEditSideEffect,
  CategoryDeleteSideEffect,
} from "use-cases/interfaces/category-service";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { MetaInfoUpdateSideEffect } from "use-cases/interfaces/meta-service";
import type { MetaInformationDatabaseInterface } from "use-cases/interfaces/meta-db";
import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";

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
      post?: CategoryAddSideEffect | undefined;
      patch?: CategoryEditSideEffect | undefined;
    };
    project: {
      delete: ProjectDeleteSideEffect;
      post?: ProjectAddSideEffect | undefined;
      patch?: ProjectEditSideEffect | undefined;
    };
    meta: {
      patch?: MetaInfoUpdateSideEffect | undefined;
    };
  };
}

export function makeServices(factoryArg: makeServices_Argument) {
  const { databases, sideEffects } = factoryArg;

  const project = makeProjectService({
    db: databases.project,

    postSideEffect: sideEffects.project.post,
    patchSideEffect: sideEffects.project.patch,
    deleteSideEffect: sideEffects.project.delete,
  });
  const category = makeCategoryService({
    database: databases.category,

    postSideEffect: sideEffects.category.post,
    patchSideEffect: sideEffects.category.patch,
    deleteSideEffect: sideEffects.category.delete,
  });
  const workSession = makeWorkSessionService({
    db: databases.workSession,
  });
  const metaInfo = makeMetaInformationService({
    db: databases.metaInfo,
    patchSideEffect: sideEffects.meta.patch,
  });

  return Object.freeze({ project, category, workSession, metaInfo } as const);
}
