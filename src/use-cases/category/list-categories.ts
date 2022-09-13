import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryFields } from "entities/category/category";
import type { MakeCategoryIfNotCorrupted } from "use-cases/interfaces/category-util";

import EPP from "common/util/epp";
import Category from "entities/category";

interface MakeListAllCategories_Argument {
  db: Pick<CategoryDatabaseInterface, "findAll">;
  makeCategoryIfNotCorrupted: MakeCategoryIfNotCorrupted;
}

export default function makeListAllCategories(
  arg: MakeListAllCategories_Argument
) {
  const { db, makeCategoryIfNotCorrupted } = arg;

  interface ListAllCategories_Result {
    corruptionError: EPP[];
    categories: Readonly<CategoryFields>[];
  }

  return async function listAllCategories(): Promise<ListAllCategories_Result> {
    const allCategoryRecords = await db.findAll();

    const result: ListAllCategories_Result = {
      categories: [],
      corruptionError: [],
    };

    for (const categoryInfo of allCategoryRecords)
      try {
        const category = makeCategoryIfNotCorrupted({
          CategoryClass: Category,
          categoryRecord: categoryInfo,
        }).toPlainObject();

        result.categories.push(category);
      } catch (ex: any) {
        result.corruptionError.push(ex);
      }

    return result;
  };
}
