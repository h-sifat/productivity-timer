import WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";

interface MakeGetWorkSessionMaxId_Argument {
  db: Pick<WorkSessionDatabaseInterface, "getMaxId">;
}
export default function makeGetWorkSessionMaxId(
  builderArg: MakeGetWorkSessionMaxId_Argument
) {
  const { db } = builderArg;

  return async function getMaxId(): Promise<number> {
    return await db.getMaxId();
  };
}
