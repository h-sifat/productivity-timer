import type {
  CategoryInterface,
  CategoryConstructor_Argument,
} from "entities/category/category";
import type CategoryDatabase from "./interfaces/category-db";
// end of type imports

import EPP from "common/util/epp";
import Category from "entities/category";
// end of concrete imports

export interface AddCategory_Argument {
  categoryInfo: CategoryConstructor_Argument;
}

interface MakeAddCategory_Argument {
  db: CategoryDatabase;
}
export default function makeAddCategory(arg: MakeAddCategory_Argument) {
  const { db } = arg;

  return async function addCategory(
    arg: AddCategory_Argument
  ): Promise<CategoryInterface> {
    const { categoryInfo } = arg;
    const insertingCategory = new Category(categoryInfo);

    {
      const existingRecord = await db.findByHash({
        hash: insertingCategory.hash,
      });

      if (existingRecord) {
        try {
          const existingCategory = new Category(existingRecord);

          if (existingCategory.hash !== insertingCategory.hash)
            throw new EPP({
              code: "HASH_MISMATCH",
              message: `The generated hash from the existing category in db doesn't match with the inserting one`,
            });

          return existingCategory;
        } catch (ex) {
          throw new EPP({
            code: "CATEGORY_CORRUPTED_IN_DB",
            otherInfo: { originalError: ex, existingRecord },
            message: `The category with id: "${insertingCategory.id}" and name: "${insertingCategory.name}" is corrupted in db.`,
          });
        }
      }
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
