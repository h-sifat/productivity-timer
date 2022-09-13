import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryFields } from "entities/category/category";
import type { MakeCategoryIfNotCorrupted } from "use-cases/interfaces/category-util";

import EPP from "common/util/epp";
import Category from "entities/category";

interface MakeListAllCategories_Argument {
  db: Pick<CategoryDatabaseInterface, "findAll">;
  makeCategoryIfNotCorrupted: MakeCategoryIfNotCorrupted;
}

export default function makeListCategories(
  arg: MakeListAllCategories_Argument
) {
  const { db, makeCategoryIfNotCorrupted } = arg;

  interface ListCategories_Result {
    categories: Readonly<CategoryFields>[];
    corrupted: { error: EPP; record: Partial<CategoryFields> }[];
  }

  return async function listCategories(): Promise<ListCategories_Result> {
    const allCategoryRecords = await db.findAll();

    const result: ListCategories_Result = {
      corrupted: [],
      categories: [],
    };

    for (const categoryRecord of allCategoryRecords)
      try {
        const category = makeCategoryIfNotCorrupted({
          CategoryClass: Category,
          categoryRecord: categoryRecord,
        }).toPlainObject();

        result.categories.push(category);
      } catch (ex: any) {
        result.corrupted.push({
          error: ex,
          record: categoryRecord,
        });
      }

    return result;
  };
}
