import getID from "src/data-access/id";
import { getConfig } from "src/config";
import makeCategoryClass from "./category";
import { createMD5Hash } from "common/util/other";
import { assertValidString } from "common/validator/string";
import { assertValidUnixMsTimestamp } from "common/util/date-time";

const config = getConfig();

const Category = makeCategoryClass({
  assertValidString,
  createHash: createMD5Hash,
  assertValidUnixMsTimestamp,
  currentTimeMs: () => Date.now(),
  Id: getID({ entity: "category" }),
  MAX_NAME_LENGTH: config.CATEGORY_MAX_NAME_LENGTH,
  VALID_NAME_PATTERN: config.CATEGORY_VALID_NAME_PATTERN,
  MAX_DESCRIPTION_LENGTH: config.CATEGORY_MAX_DESCRIPTION_LENGTH,
  MSG_NAME_DOES_NOT_MATCH_PATTERN:
    config.CATEGORY_MSG_NAME_DOES_NOT_MATCH_PATTERN,
});

export default Category;
