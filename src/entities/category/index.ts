import makeCategoryClass from "./category";
import { getDefaultConfig } from "src/config";
import { createMD5Hash } from "common/util/other";
import getID from "src/date-access/id";
import {
  isValidUnixMsTimestamp,
  makeTimestampsValidator,
} from "common/util/date-time";
import { assertValidString } from "common/validator/string";

const creationAndModificationTimestampsValidator = makeTimestampsValidator({
  getNewTimestamp: () => Date.now(),
  isValidTimestamp: isValidUnixMsTimestamp,
});

const Category = makeCategoryClass({
  assertValidString,
  createHash: createMD5Hash,
  Id: getID({ entity: "category" }),
  creationAndModificationTimestampsValidator,
  ...getDefaultConfig({ entity: "category" }),
});

export default Category;
