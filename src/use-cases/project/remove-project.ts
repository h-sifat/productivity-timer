import type { ID } from "common/interfaces/id";
import type ProjectDatabase from "use-cases/interfaces/project-db";

import EPP from "common/util/epp";

interface MakeRemoveProject_Argument {
  isValidId: ID["isValid"];
  db: Pick<ProjectDatabase, "deleteById">;
}

interface RemoveProject_Argument {
  id: string;
}

export default function makeRemoveProject(arg: MakeRemoveProject_Argument) {
  const { isValidId, db } = arg;

  return async function removeProject(arg: RemoveProject_Argument) {
    const { id } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    return await db.deleteById({ id });
  };
}
