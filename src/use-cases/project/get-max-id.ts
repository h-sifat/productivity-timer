import ProjectDatabaseInterface from "use-cases/interfaces/project-db";

interface MakeGetProjectMaxId_Argument {
  db: Pick<ProjectDatabaseInterface, "getMaxId">;
}
export default function makeGetProjectMaxId(
  builderArg: MakeGetProjectMaxId_Argument
) {
  const { db } = builderArg;

  return async function getMaxId(): Promise<number> {
    return await db.getMaxId();
  };
}
