import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";

interface makeGetWorkSessionStats_Argument {
  db: Pick<WorkSessionDatabaseInterface, "getStats">;
}
export default function makeGetWorkSessionStats(
  factoryArg: makeGetWorkSessionStats_Argument
): WorkSessionServiceInterface["getStats"] {
  const { db } = factoryArg;

  return async function getMaxId() {
    return await db.getStats();
  };
}
