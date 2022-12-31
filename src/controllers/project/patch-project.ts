import type { Controller } from "../interface";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

import required from "common/util/required";

export interface MakePatchProject_Argument {
  projectService: Pick<ProjectServiceInterface, "editProject">;
}

export default function makePatchProject(
  builderArg: MakePatchProject_Argument
): Controller {
  const { projectService } = builderArg;

  /**
   * **patch** projects/`:id`
   * body: `{changes: {...}}`
   * */
  return async function patchProject(request) {
    try {
      const { id = required("query.id", "MISSING_ID") } = request.query;
      const { changes = required("body.changes", "MISSING_CHANGES") } =
        request.body;

      const edited = await projectService.editProject({ id, changes });
      return { body: { success: true, data: edited } };
    } catch (ex) {
      return {
        body: { success: false, error: { message: ex.message, code: ex.code } },
      };
    }
  };
}
