import type { ProjectFields } from "entities/project/project";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";

interface MakeListProjects_Argument {
  db: Pick<ProjectDatabaseInterface, "findAll">;
}

export default function makeListProjects(arg: MakeListProjects_Argument) {
  const { db } = arg;

  return async function listProjects(): Promise<ProjectFields[]> {
    return await db.findAll();
  };
}
