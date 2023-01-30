import type {
  CategoryAddSideEffect,
  CategoryServiceInterface,
} from "use-cases/interfaces/category-service";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
// end of type imports

import EPP from "common/util/epp";
import { assert } from "handy-types";
import Category from "entities/category";
import required from "common/util/required";
// end of concrete imports

interface MakeAddCategory_Argument {
  db: Pick<CategoryDatabaseInterface, "findByHash" | "findById" | "insert">;
  sideEffect?: CategoryAddSideEffect | undefined;
}
export default function makeAddCategory(
  factoryArg: MakeAddCategory_Argument
): CategoryServiceInterface["addCategory"] {
  const { db } = factoryArg;

  return async function addCategory(arg) {
    assert("plain_object", arg, {
      code: "INVALID_ARGUMENT_TYPE",
      name: "AddCategory argument",
    });

    const { categoryInfo = required("categoryInfo", "MISSING_CATEGORY_INFO") } =
      arg;

    const insertingCategory = Category.make(categoryInfo);

    {
      const existingCategory = await db.findByHash({
        hash: insertingCategory.hash,
      });

      if (existingCategory) {
        const { name, parentId } = existingCategory;
        throw new EPP({
          code: "CATEGORY_EXISTS",
          message: `Another category with the name: ${name} and parentId: ${parentId} already exits.`,
        });
      }
    }

    if (insertingCategory.parentId) {
      const parent = await db.findById({ id: insertingCategory.parentId });

      if (!parent)
        throw new EPP({
          code: "PARENT_NOT_FOUND",
          message: `No parent category exists with id: "${insertingCategory.parentId}"`,
        });
    }

    await db.insert(insertingCategory);

    if (factoryArg.sideEffect) factoryArg.sideEffect(insertingCategory);

    return insertingCategory;
  };
}
