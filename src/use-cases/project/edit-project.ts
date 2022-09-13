import type { ID } from "common/interfaces/id";
import type { ProjectFields } from "entities/project/project";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";

import EPP from "common/util/epp";
import Project from "entities/project";

interface MakeEditProject_Argument {
  isValidId: ID["isValid"];
  getCurrentTimestamp(): number;
  db: Pick<ProjectDatabaseInterface, "findById" | "updateById">;
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
        code: "NOT_FOUND",
        message: `No project exist with id: "${id}"`,
      });

    {
      // don't change property order
      const editedProjectInfo = {
        ...existingProjectRecord,
        ...changes,
        modifiedOn: getCurrentTimestamp(),
        id,
      };

      const validatedProjectInfo = new Project(
        editedProjectInfo
      ).toPlainObject();
      await db.updateById({ id, changes: validatedProjectInfo });

      return validatedProjectInfo;
    }
  };
}
