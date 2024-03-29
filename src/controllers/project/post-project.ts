import type { Controller } from "../interface";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

export interface MakePostProject_Argument {
  projectService: Pick<ProjectServiceInterface, "addProject">;
}

export default function makePostProject(
  builderArg: MakePostProject_Argument
): Controller {
  const { projectService } = builderArg;

  return async function postProject(request) {
    const projectInfo = request.body;

    try {
      const project = await projectService.addProject({ projectInfo });
      return { body: { success: true, data: project } };
    } catch (ex) {
      return {
        body: { success: false, error: { message: ex.message, code: ex.code } },
      };
    }
  };
}
