import type { ID } from "common/interfaces/id";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectFields } from "entities/project/project";

import EPP from "common/util/epp";
import Project from "entities/project";

interface MakeGetProject_Argument {
  db: Pick<ProjectDatabaseInterface, "findById">;
  isValidId: ID["isValid"];
}

interface GetProject_Argument {
  id: string;
}

export default function makeGetProject(arg: MakeGetProject_Argument) {
  const { db, isValidId } = arg;
  return async function getProject(
    arg: GetProject_Argument
  ): Promise<Readonly<ProjectFields>> {
    const { id } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    const projectRecord = await db.findById({ id });
    if (!projectRecord)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No project exists with id: "${id}"`,
      });

    try {
      return new Project(projectRecord).toPlainObject();
    } catch (ex) {
      throw new EPP({
        code: "CORRUPTED",
        otherInfo: { record: projectRecord, originalError: ex },
        message: `The project with id: "${id}" is corrupted.`,
      });
    }
  };
}
