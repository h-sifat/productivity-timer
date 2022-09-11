import {
  convertDuration,
  isValidUnixMsTimestamp,
  makeTimestampsValidator,
} from "common/util/date-time";
import getID from "src/date-access/id";
import makeProjectClass from "./project";
import { getDefaultConfig } from "src/config";
import { isValid as isValidId } from "common/util/id";
import makeProjectCategoryClass from "./project-category";
import { assertValidString } from "common/validator/string";

const Id = getID({ entity: "project" });
const ProjectCategory = makeProjectCategoryClass({ isValidId });
const validateTimestamps = makeTimestampsValidator({
  getNewTimestamp: () => Date.now(),
  isValidTimestamp: isValidUnixMsTimestamp,
});
const { MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH, MIN_HOUR_BEFORE_DEADLINE } =
  getDefaultConfig({ entity: "project" });

const Project = makeProjectClass({
  Id,
  MAX_NAME_LENGTH,
  ProjectCategory,
  convertDuration,
  assertValidString,
  validateTimestamps,
  MAX_DESCRIPTION_LENGTH,
  isValidUnixMsTimestamp,
  MIN_HOUR_BEFORE_DEADLINE,
});

export default Project;
