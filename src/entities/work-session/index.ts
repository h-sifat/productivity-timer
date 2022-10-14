import {
  assertValidUnixMsTimestamp,
  assertValidUSLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
} from "common/util/date-time";
import getID from "data-access/id";
import { getDefaultEntityConfig } from "src/config";
import buildWorkSessionEntity from "./work-session";

const WorkSession = buildWorkSessionEntity({
  assertValidUnixMsTimestamp,
  assertValidUSLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
  Id: getID({ entity: "work-session" }),
  ...getDefaultEntityConfig({ entity: "work_session" }),
});

export default WorkSession;
