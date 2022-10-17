import {
  assertValidUnixMsTimestamp,
  assertValidUSLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
} from "common/util/date-time";
import { deepFreeze } from "common/util/other";
import getID from "data-access/id";
import { getDefaultEntityConfig } from "src/config";
import buildWorkSessionEntity from "./work-session";

const WorkSession = buildWorkSessionEntity({
  deepFreeze,
  assertValidUnixMsTimestamp,
  assertValidUSLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
  Id: getID({ entity: "work-session" }),
  ...getDefaultEntityConfig({ entity: "work_session" }),
});

export default WorkSession;
