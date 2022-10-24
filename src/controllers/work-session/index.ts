import makeGetWorkSessions from "./get-work-sessions";

import type { WorkSessionControllerInterface } from "./interface";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";

export interface MakeGetWorkSessionController_Argument {
  workSessionService: WorkSessionServiceInterface;
}
export default function makeGetWorkSessionController(
  builderArg: MakeGetWorkSessionController_Argument
): WorkSessionControllerInterface {
  const { workSessionService } = builderArg;

  const workSessionController = Object.freeze({
    getWorkSessions: makeGetWorkSessions({ workSessionService }),
  });

  return workSessionController;
}
