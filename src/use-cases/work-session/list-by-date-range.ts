import type {
  CurrentTimeMs,
  AssertValidUSLocaleDateString,
  UnixMsTimestampToUsLocaleDateString,
} from "common/interfaces/date-time";
import type { WorkSessionFields } from "entities/work-session/work-session";
import type { QueryMethodArguments } from "use-cases/interfaces/work-session-db";
import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";

import EPP from "common/util/epp";
import required from "common/util/required";

interface BuildListWorkSessionsByDateRange_Argument {
  currentTimeMs: CurrentTimeMs;
  db: Pick<WorkSessionDatabaseInterface, "findByDateRange">;
  assertValidUSLocaleDateString: AssertValidUSLocaleDateString;
  unixMsTimestampToUsLocaleDateString: UnixMsTimestampToUsLocaleDateString;
}

export default function buildListWorkSessionsByDateRange(
  builderArg: BuildListWorkSessionsByDateRange_Argument
) {
  const { db, currentTimeMs, unixMsTimestampToUsLocaleDateString } = builderArg;
  const assertValidUSLocaleDateString: AssertValidUSLocaleDateString =
    builderArg.assertValidUSLocaleDateString;

  return async function listWorkSessionsByDateRange(
    arg: QueryMethodArguments["findByDateRange"]
  ): Promise<WorkSessionFields[]> {
    const {
      from = required("from"),
      to = unixMsTimestampToUsLocaleDateString(currentTimeMs()),
    } = arg;

    assertValidUSLocaleDateString(to, "INVALID_DATE_STRING:TO");
    assertValidUSLocaleDateString(from, "INVALID_DATE_STRING:FROM");

    if (new Date(from).valueOf() > new Date(to).valueOf())
      throw new EPP({
        code: "FROM_GREATER_THAN_TO",
        message: `The "from" date (${from}) must be less than or equal to "to" date ${to}.`,
      });

    return db.findByDateRange({ from, to });
  };
}
