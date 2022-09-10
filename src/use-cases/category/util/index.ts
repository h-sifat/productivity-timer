import type { MakeCategoryIfNotCorrupted } from "../interfaces/util";

import EPP from "common/util/epp";
import { CategoryInterface } from "entities/category/category";

const makeCategoryIfNotCorrupted: MakeCategoryIfNotCorrupted =
  function _makeCategoryIfNotCorrupted(arg) {
    const { CategoryClass: Category, categoryRecord } = arg;

    let category: CategoryInterface;

    try {
      category = new Category(categoryRecord);
    } catch (ex) {
      const { id, name } = categoryRecord;
      throw new EPP({
        otherInfo: {
          categoryRecord,
          originalError: ex,
          reason: "INVALID_FIELD",
        },
        code: "CATEGORY_CORRUPTED_IN_DB",
        message: getErrorMessage({ id, name }),
      });
    }

    if (category.hash !== categoryRecord.hash)
      throw new EPP({
        code: "CATEGORY_CORRUPTED_IN_DB",
        otherInfo: { reason: "HASH_MISMATCH", categoryRecord },
        message: getErrorMessage({ id: category.id, name: category.name }),
      });

    return category;

    function getErrorMessage(arg: { id: string; name: string }): string {
      const { id, name } = arg;
      return `The category with id: "${id}" and name: "${name}" is corrupted in db.`;
    }
  };

export default makeCategoryIfNotCorrupted;
