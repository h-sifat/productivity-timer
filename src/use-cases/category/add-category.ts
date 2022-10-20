import type {
  CategoryFields,
  MakeCategory_Argument,
} from "entities/category/category";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
// end of type imports

import EPP from "common/util/epp";
import Category from "entities/category";
// end of concrete imports

export interface AddCategory_Argument {
  categoryInfo: MakeCategory_Argument;
}

interface MakeAddCategory_Argument {
  db: Pick<CategoryDatabaseInterface, "findByHash" | "findById" | "insert">;
}
export default function makeAddCategory(arg: MakeAddCategory_Argument) {
  const { db } = arg;

  return async function addCategory(
    arg: AddCategory_Argument
  ): Promise<Readonly<CategoryFields>> {
    const { categoryInfo } = arg;
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
    return insertingCategory;
  };
}
