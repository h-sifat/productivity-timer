import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";

interface MakeGetWorkSessionMaxId_Argument {
  db: Pick<WorkSessionDatabaseInterface, "getMaxId">;
}
export default function makeGetWorkSessionMaxId(
  builderArg: MakeGetWorkSessionMaxId_Argument
): WorkSessionServiceInterface["getMaxId"] {
  const { db } = builderArg;

  return async function getMaxId() {
    return await db.getMaxId();
  };
}
