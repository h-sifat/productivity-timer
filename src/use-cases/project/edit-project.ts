import type { ID } from "common/interfaces/id";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectFields, Edit_Argument } from "entities/project/project";

import EPP from "common/util/epp";
import Project from "entities/project";

interface MakeEditProject_Argument {
  isValidId: ID["isValid"];
  db: Pick<ProjectDatabaseInterface, "findById" | "updateById">;
}

interface EditProject_Argument {
  id: string;
  changes: Edit_Argument["changes"];
}

export default function makeEditProject(arg: MakeEditProject_Argument) {
  const { isValidId, db } = arg;

  return async function editProject(
    arg: EditProject_Argument
  ): Promise<ProjectFields> {
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
      await db.updateById({ id, changes: editedProject });

      return editedProject;
    }
  };
}
