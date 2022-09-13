import type { CategoryInterface } from "entities/category/category";
import type { MakeCategoryIfNotCorrupted } from "use-cases/interfaces/category-util";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

const makeCategoryIfNotCorrupted: MakeCategoryIfNotCorrupted =
  function _makeCategoryIfNotCorrupted(arg) {
    const { CategoryClass: Category, categoryRecord } = arg;

    let category: CategoryInterface;

    {
      const { id = required("id", "CORRUPTED") } = categoryRecord;

      assert<string>("non_empty_string", id, {
        code: "CORRUPTED",
        otherInfo: { record: categoryRecord, reason: "INVALID_FIELD" },
        message: `The category with name: "${categoryRecord.name}" is corrupted.`,
      });
    }

    try {
      category = new Category(categoryRecord);
    } catch (ex) {
      const { id, name } = categoryRecord;
      throw new EPP({
        otherInfo: {
          originalError: ex,
          record: categoryRecord,
          reason: "INVALID_FIELD",
        },
        code: "CORRUPTED",
        message: getErrorMessage({ id, name }),
      });
    }

    if (category.hash !== categoryRecord.hash)
      throw new EPP({
        code: "CORRUPTED",
        otherInfo: { reason: "HASH_MISMATCH", record: categoryRecord },
        message: getErrorMessage({ id: category.id, name: category.name }),
      });

    return category;

    function getErrorMessage(arg: { id: string; name: string }): string {
      const { id, name } = arg;
      return `The category with id: "${id}" and name: "${name}" is corrupted in db.`;
    }
  };

export default makeCategoryIfNotCorrupted;
