import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";

import required from "common/util/required";
import WorkSession from "entities/work-session";
import { assert } from "handy-types";

interface MakeAddWorkSession_Argument {
  db: Pick<WorkSessionDatabaseInterface, "insert">;
}

export default function makeAddWorkSession(
  builderArg: MakeAddWorkSession_Argument
): WorkSessionServiceInterface["addWorkSession"] {
  const { db } = builderArg;

  return async function addWorkSession(arg) {
    assert("plain_object", arg, {
      code: "INVALID_ARGUMENT_TYPE",
      name: "AddWorkSession argument",
    });

    const {
      workSessionInfo = required(
        "workSessionInfo",
        "MISSING_WORK_SESSION_INFO"
      ),
    } = arg;

    const workSession = WorkSession.make(workSessionInfo);

    await db.insert(workSession);

    return workSession;
  };
}
