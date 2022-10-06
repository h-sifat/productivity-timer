import getID from "src/data-access/id";
import makeCategoryClass from "./category";
import { getDefaultEntityConfig } from "src/config";
import { createMD5Hash } from "common/util/other";
import { assertValidString } from "common/validator/string";
import { assertValidUnixMsTimestamp } from "common/util/date-time";

const Category = makeCategoryClass({
  assertValidString,
  createHash: createMD5Hash,
  assertValidUnixMsTimestamp,
  currentTimeMs: () => Date.now(),
  Id: getID({ entity: "category" }),
  ...getDefaultEntityConfig({ entity: "category" }),
});

export default Category;
