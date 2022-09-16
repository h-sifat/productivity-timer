import type { ID } from "common/interfaces/id";
import type { ProjectFields } from "entities/project/project";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";

import EPP from "common/util/epp";

interface MakeGetProject_Argument {
  isValidId: ID["isValid"];
  db: Pick<ProjectDatabaseInterface, "findById">;
}

interface GetProject_Argument {
  id: string;
}

export default function makeGetProject(arg: MakeGetProject_Argument) {
  const { db, isValidId } = arg;
  return async function getProject(
    arg: GetProject_Argument
  ): Promise<ProjectFields | null> {
    const { id } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    return await db.findById({ id });
  };
}
