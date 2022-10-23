import type {
  CurrentTimeMs,
  AssertValidUSLocaleDateString,
  UnixMsTimestampToUsLocaleDateString,
} from "common/interfaces/date-time";
import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

interface makeListWorkSessionsByDateRange_Argument {
  currentTimeMs: CurrentTimeMs;
  db: Pick<WorkSessionDatabaseInterface, "findByDateRange">;
  assertValidUSLocaleDateString: AssertValidUSLocaleDateString;
  unixMsTimestampToUsLocaleDateString: UnixMsTimestampToUsLocaleDateString;
}

export default function makeListWorkSessionsByDateRange(
  builderArg: makeListWorkSessionsByDateRange_Argument
): WorkSessionServiceInterface["listWorkSessionsByDateRange"] {
  const { db, currentTimeMs, unixMsTimestampToUsLocaleDateString } = builderArg;
  const assertValidUSLocaleDateString: AssertValidUSLocaleDateString =
    builderArg.assertValidUSLocaleDateString;

  return async function listWorkSessionsByDateRange(arg) {
    assert("plain_object", arg, {
      code: "INVALID_ARGUMENT_TYPE",
      name: "ListWorkSessionsByDateRange argument",
    });

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
