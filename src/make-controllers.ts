import makeProjectController from "./controllers/project";
import makeCategoryController from "./controllers/category";
import { makeMetaInfoControllers } from "./controllers/meta";
import makeGetWorkSessionController from "./controllers/work-session";

import type { MetaInfoServiceInterface } from "use-cases/interfaces/meta-service";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";

export interface makeControllers_Argument {
  services: {
    project: ProjectServiceInterface;
    category: CategoryServiceInterface;
    metaInfo: MetaInfoServiceInterface;
    workSession: WorkSessionServiceInterface;
  };
}
export function makeControllers(factoryArg: makeControllers_Argument) {
  const { services } = factoryArg;

  const project = makeProjectController({
    projectService: services.project,
  });
  const category = makeCategoryController({
    categoryService: services.category,
  });
  const workSession = makeGetWorkSessionController({
    workSessionService: services.workSession,
  });
  const metaInfo = makeMetaInfoControllers({ service: services.metaInfo });

  return Object.freeze({ project, category, workSession, metaInfo } as const);
}
