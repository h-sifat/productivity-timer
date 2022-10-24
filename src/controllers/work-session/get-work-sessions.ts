import type { Controller } from "../interface";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";

import required from "common/util/required";

export interface MakeGetWorkSessions_Argument {
  workSessionService: Pick<
    WorkSessionServiceInterface,
    "listWorkSessionsByDateRange"
  >;
}
export default function makeGetWorkSessions(
  builderArg: MakeGetWorkSessions_Argument
): Controller {
  const { workSessionService } = builderArg;

  /**
   * RequestURL | Method to use
   * ---------- | ------
   * get /work-sessions?`fromDate=1/1/2022&toDate=1/5/2022` | listByDateRange
   * */
  return async function getWorkSessions(request) {
    const { query } = request;
    try {
      const {
        fromDate = required("fromDate", {
          code: "MISSING_FROM_DATE",
          objectName: "url parameters",
        }),
      } = query;

      const listByDateRangeArgument =
        "toDate" in query
          ? { from: fromDate, to: query.toDate }
          : { from: fromDate };

      const workSessions = await workSessionService.listWorkSessionsByDateRange(
        listByDateRangeArgument
      );

      return { body: workSessions, error: null };
    } catch (ex) {
      return { error: { message: ex.message, code: ex.code }, body: {} };
    }
  };
}
