import type {
  CategoryInterface,
  CategoryConstructor_Argument,
} from "entities/category/category";
import type CategoryDatabase from "./interfaces/category-db";
import type { MakeCategoryIfNotCorrupted } from "./interfaces/util";
// end of type imports

import EPP from "common/util/epp";
import Category from "entities/category";
// end of concrete imports

export interface AddCategory_Argument {
  categoryInfo: CategoryConstructor_Argument;
}

interface MakeAddCategory_Argument {
  db: Pick<CategoryDatabase, "findByHash" | "findById" | "insert">;
  makeCategoryIfNotCorrupted: MakeCategoryIfNotCorrupted;
}
export default function makeAddCategory(arg: MakeAddCategory_Argument) {
  const { db, makeCategoryIfNotCorrupted } = arg;

  return async function addCategory(
    arg: AddCategory_Argument
  ): Promise<CategoryInterface> {
    const { categoryInfo } = arg;
    const insertingCategory = new Category(categoryInfo);

    {
      const existingRecord = await db.findByHash({
        hash: insertingCategory.hash,
      });

      if (existingRecord)
        return makeCategoryIfNotCorrupted({
          CategoryClass: Category,
          categoryRecord: existingRecord,
        });
    }

    if (insertingCategory.parentId) {
      const parent = await db.findById({ id: insertingCategory.parentId });

      if (!parent)
        throw new EPP({
          code: "PARENT_DOES_NOT_EXIST",
          message: `No parent category with id: "${insertingCategory.parentId}"`,
        });
    }

    await db.insert({ categoryInfo: insertingCategory.toPlainObject() });

    return insertingCategory;
  };
}
