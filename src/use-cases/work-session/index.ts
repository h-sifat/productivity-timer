import {
  currentTimeMs,
  assertValidUSLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
} from "common/util/date-time";

import makeGetWorkSessionMaxId from "./get-max-id";
import makeGetWorkSessionStats from "./get-stats";
import makeAddWorkSession from "./add-work-session";
import makeListWorkSessionsByDateRange from "./list-by-date-range";

import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";

interface MakeWorkSessionService_Argument {
  db: WorkSessionDatabaseInterface;
}
export default function makeWorkSessionService(
  builderArg: MakeWorkSessionService_Argument
): WorkSessionServiceInterface {
  const { db } = builderArg;

  const listWorkSessionsByDateRange = makeListWorkSessionsByDateRange({
    db,
    currentTimeMs,
    assertValidUSLocaleDateString,
    unixMsTimestampToUsLocaleDateString,
  });

  const workSessionService = Object.freeze({
    listWorkSessionsByDateRange,
    getMaxId: makeGetWorkSessionMaxId({ db }),
    getStats: makeGetWorkSessionStats({ db }),
    addWorkSession: makeAddWorkSession({ db }),
    getWorkSessionMaxId: makeGetWorkSessionMaxId({ db }),
  });

  return workSessionService;
}
