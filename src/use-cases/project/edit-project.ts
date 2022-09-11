import type { ID } from "common/interfaces/id";
import type { ProjectFields } from "entities/project/project";
import type ProjectDatabase from "use-cases/interfaces/project-db";

import EPP from "common/util/epp";
import Project from "entities/project";

interface MakeEditProject_Argument {
  isValidId: ID["isValid"];
  getCurrentTimestamp(): number;
  db: Pick<ProjectDatabase, "findById" | "updateById">;
}

interface EditProject_Argument {
  id: string;
  changes: Partial<ProjectFields>;
}

export default function makeEditProject(arg: MakeEditProject_Argument) {
  const { isValidId, db, getCurrentTimestamp } = arg;

  return async function editProject(
    arg: EditProject_Argument
  ): Promise<ProjectFields> {
    const { id, changes } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    const existingProjectRecord = await db.findById({ id });

    if (!existingProjectRecord)
      throw new EPP({
        code: "PROJECT_DOES_NOT_EXIST",
        message: `No project exist with id: "${id}"`,
      });

    {
      // don't change property order
      const editedInfo = {
        ...existingProjectRecord,
        ...changes,
        modifiedOn: getCurrentTimestamp(),
        id,
      };

      const editedProjectInfo = new Project(editedInfo).toPlainObject();
      await db.updateById({ id, projectInfo: editedProjectInfo });

      return editedProjectInfo;
    }
  };
}
