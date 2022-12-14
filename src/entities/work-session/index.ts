import {
  assertValidUnixMsTimestamp,
  assertValidUSLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
} from "common/util/date-time";
import { deepFreeze } from "common/util/other";
import getID from "data-access/id";
import { getConfig } from "src/config";
import buildWorkSessionEntity from "./work-session";

const config = getConfig();

const WorkSession = buildWorkSessionEntity({
  deepFreeze,
  assertValidUnixMsTimestamp,
  assertValidUSLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
  Id: getID({ entity: "work-session" }),
  MAX_ALLOWED_ELAPSED_TIME_DIFF:
    config.WORK_SESSION_MAX_ALLOWED_ELAPSED_TIME_DIFF,
});

export default WorkSession;
