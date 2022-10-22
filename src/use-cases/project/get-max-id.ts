import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

interface MakeGetProjectMaxId_Argument {
  db: Pick<ProjectDatabaseInterface, "getMaxId">;
}
export default function makeGetProjectMaxId(
  builderArg: MakeGetProjectMaxId_Argument
): ProjectServiceInterface["getMaxId"] {
  const { db } = builderArg;

  return async function getMaxId() {
    return await db.getMaxId();
  };
}
