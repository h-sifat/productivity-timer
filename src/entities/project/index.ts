import {
  currentTimeMs,
  convertDuration,
  assertValidUnixMsTimestamp,
} from "common/util/date-time";
import getID from "src/data-access/id";
import buildProjectEntity from "./project";
import { getConfig } from "src/config";
import { assertValidString } from "common/validator/string";

const config = getConfig();

const Project = buildProjectEntity({
  currentTimeMs,
  convertDuration,
  assertValidString,
  assertValidUnixMsTimestamp,
  Id: getID({ entity: "project" }),
  MAX_NAME_LENGTH: config.PROJECT_MAX_NAME_LENGTH,
  VALID_NAME_PATTERN: config.PROJECT_VALID_NAME_PATTERN,
  MAX_DESCRIPTION_LENGTH: config.PROJECT_MAX_DESCRIPTION_LENGTH,
  MIN_HOUR_BEFORE_DEADLINE: config.PROJECT_MIN_HOUR_BEFORE_DEADLINE,
  MSG_NAME_DOES_NOT_MATCH_PATTERN:
    config.PROJECT_MSG_NAME_DOES_NOT_MATCH_PATTERN,
});

export default Project;
