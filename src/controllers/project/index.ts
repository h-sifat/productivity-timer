import type { ProjectControllerInterface } from "./interface";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

import makePostProject from "./post-project";
import makeGetCategories from "./get-projects";
import makePatchProject from "./patch-project";
import makeDeleteProject from "./delete-project";

export interface MakeProjectController_Argument {
  projectService: ProjectServiceInterface;
}

export default function makeProjectController(
  builderArg: MakeProjectController_Argument
): ProjectControllerInterface {
  const projectController = Object.freeze({
    postProject: makePostProject(builderArg),
    patchProject: makePatchProject(builderArg),
    getCategories: makeGetCategories(builderArg),
    deleteProject: makeDeleteProject(builderArg),
  });

  return projectController;
}
