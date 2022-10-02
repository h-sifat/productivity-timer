import {
  currentTimeMs,
  convertDuration,
  assertValidUnixMsTimestamp,
} from "common/util/date-time";
import getID from "src/date-access/id";
import buildProjectEntity from "./project";
import { getDefaultEntityConfig } from "src/config";
import { assertValidString } from "common/validator/string";

const Project = buildProjectEntity({
  currentTimeMs,
  convertDuration,
  assertValidString,
  assertValidUnixMsTimestamp,
  Id: getID({ entity: "project" }),
  ...getDefaultEntityConfig({ entity: "project" }),
});

export default Project;
