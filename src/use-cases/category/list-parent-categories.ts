import { ID } from "common/interfaces/id";
import EPP from "common/util/epp";
import required from "common/util/required";
import { assert } from "handy-types";

import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

interface MakeListParentCategories_Argument {
  isValidId: ID["isValid"];
  db: Pick<CategoryDatabaseInterface, "findById" | "findParentCategories">;
}

export default function makeListParentCategories(
  builderArg: MakeListParentCategories_Argument
): CategoryServiceInterface["listParentCategories"] {
  const { isValidId, db } = builderArg;

  return async function listParentCategories(arg) {
    assert("plain_object", arg, {
      code: "INVALID_ARGUMENT_TYPE",
      name: "ListParentCategories argument",
    });

    const { id = required("id") } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: ${id}`, "INVALID_ID");

    const category = await db.findById({ id });

    if (!category)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No category exist with id: "${id}"`,
      });

    if (!category.parentId) return [];

    return await db.findParentCategories({ id });
  };
}
