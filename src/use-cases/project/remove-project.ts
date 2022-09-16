import type { ID } from "common/interfaces/id";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";

import EPP from "common/util/epp";

interface MakeRemoveProject_Argument {
  isValidId: ID["isValid"];
  db: Pick<ProjectDatabaseInterface, "deleteById" | "findById">;
}

interface RemoveProject_Argument {
  id: string;
}

export default function makeRemoveProject(arg: MakeRemoveProject_Argument) {
  const { isValidId, db } = arg;

  return async function removeProject(arg: RemoveProject_Argument) {
    const { id } = arg;
    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    const project = await db.findById({ id });

    if (!project)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No project exists with the id: "${id}"`,
      });

    await db.deleteById({ id });

    return project;
  };
}
