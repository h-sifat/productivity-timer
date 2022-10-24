import required from "common/util/required";

import type { Controller } from "../interface";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

export interface MakeDeleteProject_Argument {
  projectService: Pick<ProjectServiceInterface, "removeProject">;
}

export default function makeDeleteProject(
  builderArg: MakeDeleteProject_Argument
): Controller {
  const { projectService } = builderArg;

  /**
   * **delete** /projects/`:id`
   * */
  return async function deleteProject(request) {
    try {
      const { id = required("params.id", "MISSING_ID") } = request.params;

      const deletedCategories = await projectService.removeProject({ id });
      return { error: null, body: deletedCategories };
    } catch (ex) {
      return { error: { message: ex.message, code: ex.code }, body: {} };
    }
  };
}
