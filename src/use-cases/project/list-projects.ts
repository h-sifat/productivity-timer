import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

interface MakeListProjects_Argument {
  db: Pick<ProjectDatabaseInterface, "findAll">;
}

export default function makeListProjects(
  builderArg: MakeListProjects_Argument
): ProjectServiceInterface["listProjects"] {
  const { db } = builderArg;

  return async function listProjects() {
    return await db.findAll();
  };
}
