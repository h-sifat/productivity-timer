import type CategoryDatabase from "./interfaces/category-db";
import type { CategoryInterface } from "entities/category/category";
import type { MakeCategoryIfNotCorrupted } from "./interfaces/util";

import EPP from "common/util/epp";
import Category from "entities/category";

interface MakeListAllCategories_Argument {
  db: Pick<CategoryDatabase, "findAll">;
  makeCategoryIfNotCorrupted: MakeCategoryIfNotCorrupted;
}

export default function makeListAllCategories(
  arg: MakeListAllCategories_Argument
) {
  const { db, makeCategoryIfNotCorrupted } = arg;

  interface ListAllCategories_Result {
    corruptionError: EPP[];
    categories: CategoryInterface[];
  }

  return async function listAllCategories(): Promise<ListAllCategories_Result> {
    const allCategoryRecords = await db.findAll();

    const result: ListAllCategories_Result = {
      categories: [],
      corruptionError: [],
    };

    for (const categoryInfo of allCategoryRecords)
      try {
        const childCategory = makeCategoryIfNotCorrupted({
          CategoryClass: Category,
          categoryRecord: categoryInfo,
        });

        result.categories.push(childCategory);
      } catch (ex: any) {
        result.corruptionError.push(ex);
      }

    return result;
  };
}
