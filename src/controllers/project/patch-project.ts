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
      const { id = required("params.id", "MISSING_ID") } = request.params;
      const { changes = required("body.changes", "MISSING_CHANGES") } =
        request.body;

      const edited = await projectService.editProject({ id, changes });
      return { error: null, body: edited };
    } catch (ex) {
      return { error: { message: ex.message, code: ex.code }, body: {} };
    }
  };
}