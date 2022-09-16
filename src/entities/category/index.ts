import getID from "src/date-access/id";
import makeCategoryClass from "./category";
import { getDefaultConfig } from "src/config";
import { createMD5Hash } from "common/util/other";
import { assertValidString } from "common/validator/string";
import { assertValidUnixMsTimestamp } from "common/util/date-time";

const Category = makeCategoryClass({
  assertValidString,
  createHash: createMD5Hash,
  assertValidUnixMsTimestamp,
  currentTimeMs: () => Date.now(),
  Id: getID({ entity: "category" }),
  ...getDefaultConfig({ entity: "category" }),
});

export default Category;
