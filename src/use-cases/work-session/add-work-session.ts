import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";

import WorkSession from "entities/work-session";

interface MakeAddWorkSession_Argument {
  db: Pick<WorkSessionDatabaseInterface, "insert">;
}

export default function makeAddWorkSession(
  builderArg: MakeAddWorkSession_Argument
): WorkSessionServiceInterface["addWorkSession"] {
  const { db } = builderArg;

  return async function addWorkSession(arg) {
    const workSession = WorkSession.make(arg);

    await db.insert(workSession);

    return workSession;
  };
}
