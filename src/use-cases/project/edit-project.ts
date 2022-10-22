import type { ID } from "common/interfaces/id";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

import EPP from "common/util/epp";
import Project from "entities/project";

interface MakeEditProject_Argument {
  isValidId: ID["isValid"];
  db: Pick<ProjectDatabaseInterface, "findById" | "updateById">;
}

export default function makeEditProject(
  builderArg: MakeEditProject_Argument
): ProjectServiceInterface["editProject"] {
  const { isValidId, db } = builderArg;

  return async function editProject(arg) {
    const { id, changes } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    const project = await db.findById({ id });

    if (!project)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No project exist with id: "${id}"`,
      });

    {
      const editedProject = Project.edit({ project, changes });
      await db.updateById({ id, edited: editedProject });

      return editedProject;
    }
  };
}
