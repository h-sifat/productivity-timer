import type { ID } from "common/interfaces/id";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

import EPP from "common/util/epp";

interface MakeRemoveProject_Argument {
  isValidId: ID["isValid"];
  db: Pick<ProjectDatabaseInterface, "deleteById" | "findById">;
}

export default function makeRemoveProject(
  builderArg: MakeRemoveProject_Argument
): ProjectServiceInterface["removeProject"] {
  const { isValidId, db } = builderArg;

  return async function removeProject(arg) {
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
