import type { ID } from "common/interfaces/id";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

interface MakeListSubCategories_Argument {
  isValidId: ID["isValid"];
  db: Pick<CategoryDatabaseInterface, "findSubCategories" | "findById">;
}

export default function makeListSubCategories(
  builderArg: MakeListSubCategories_Argument
): CategoryServiceInterface["listSubCategories"] {
  const { isValidId, db } = builderArg;

  return async function listSubCategories(arg) {
    assert("plain_object", arg, {
      code: "INVALID_ARGUMENT_TYPE",
      name: "ListSubCategories argument",
    });

    const { parentId = required("parentId", "MISSING_PARENT_ID") } = arg;

    if (!isValidId(parentId))
      throw new EPP({
        code: "INVALID_PARENT_ID",
        message: `Invalid parentId: "${parentId}"`,
      });

    {
      const parent = await db.findById({ id: parentId });
      if (!parent)
        throw new EPP({
          code: "PARENT_NOT_FOUND",
          message: `No category found with the id: "${parentId}".`,
        });
    }

    return await db.findSubCategories({ parentId });
  };
}
