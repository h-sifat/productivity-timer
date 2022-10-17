import type { DeepFreezeTypeMapper } from "common/interfaces/other";
import type { WorkSessionFields } from "entities/work-session/work-session";
import type { QueryMethodArguments } from "use-cases/interfaces/work-session-db";
import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";

import WorkSession from "entities/work-session";

interface BuildAddWorkSession_Argument {
  db: Pick<WorkSessionDatabaseInterface, "insert">;
}

export default function buildAddWorkSession(
  builderArg: BuildAddWorkSession_Argument
) {
  const { db } = builderArg;

  return async function addWorkSession(
    arg: QueryMethodArguments["insert"]
  ): Promise<DeepFreezeTypeMapper<WorkSessionFields>> {
    const workSession = WorkSession.make(arg);

    await db.insert(workSession);

    return workSession;
  };
}
