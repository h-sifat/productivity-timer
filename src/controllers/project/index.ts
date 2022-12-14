import type { ProjectControllerInterface } from "./interface";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

import makePostProject from "./post-project";
import makeGetProjects from "./get-projects";
import makePatchProject from "./patch-project";
import makeDeleteProject from "./delete-project";

export interface MakeProjectController_Argument {
  projectService: ProjectServiceInterface;
}

export default function makeProjectController(
  builderArg: MakeProjectController_Argument
): ProjectControllerInterface {
  const projectController = Object.freeze({
    get: makeGetProjects(builderArg),
    post: makePostProject(builderArg),
    patch: makePatchProject(builderArg),
    delete: makeDeleteProject(builderArg),
  });

  return projectController;
}
