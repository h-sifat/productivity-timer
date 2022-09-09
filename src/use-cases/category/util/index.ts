import type { MakeCategoryIfNotCorrupted } from "../interfaces/util";

import EPP from "common/util/epp";

const makeCategoryIfNotCorrupted: MakeCategoryIfNotCorrupted =
  function _makeCategoryIfNotCorrupted(arg) {
    const { CategoryClass: Category, categoryRecord } = arg;

    try {
      const category = new Category(categoryRecord);

      if (category.hash !== categoryRecord.hash)
        throw new EPP({
          code: "HASH_MISMATCH",
          otherInfo: { categoryRecord },
          message: getErrorMessage({ id: category.id, name: category.name }),
        });

      return category;
    } catch (ex) {
      const { id, name } = categoryRecord;
      throw new EPP({
        code: "CATEGORY_CORRUPTED_IN_DB",
        message: getErrorMessage({ id, name }),
        otherInfo: { originalError: ex, categoryRecord },
      });
    }

    function getErrorMessage(arg: { id: string; name: string }): string {
      const { id, name } = arg;
      return `The category with id: "${id}" and name: "${name}" is corrupted in db.`;
    }
  };

export default makeCategoryIfNotCorrupted;
