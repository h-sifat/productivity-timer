import makeProjectController from "./controllers/project";
import makeCategoryController from "./controllers/category";
import { makeConfigController } from "./controllers/config";
import { makeMetaInfoControllers } from "./controllers/meta";
import makeGetWorkSessionController from "./controllers/work-session";

import type { PublicConfigInterface } from "./config/interface";
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
  other: {
    config: PublicConfigInterface;
  };
}
export function makeControllers(factoryArg: makeControllers_Argument) {
  const { services, other: otherArg } = factoryArg;

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

  const config = makeConfigController({ config: otherArg.config });

  return Object.freeze({
    config,
    project,
    category,
    metaInfo,
    workSession,
  } as const);
}
