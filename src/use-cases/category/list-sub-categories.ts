import type { ID } from "common/interfaces/id";
import type CategoryDatabase from "./interfaces/category-db";
import type { MakeCategoryIfNotCorrupted } from "./interfaces/util";
import type { CategoryInterface } from "entities/category/category";

import EPP from "common/util/epp";
import Category from "entities/category";

interface MakeListSubCategories_Argument {
  Id: ID;
  db: Pick<CategoryDatabase, "findChildren">;
  makeCategoryIfNotCorrupted: MakeCategoryIfNotCorrupted;
}

interface ListSubCategories_Argument {
  id: string;
  recursive?: boolean;
}

interface ListSubCategories_Result {
  corruptionError: EPP[];
  subCategories: CategoryInterface[];
}

export default function makeListSubCategories(
  arg: MakeListSubCategories_Argument
) {
  const { Id, db, makeCategoryIfNotCorrupted } = arg;

  return async function listSubCategories(
    arg: ListSubCategories_Argument
  ): Promise<ListSubCategories_Result> {
    const { id, recursive = false } = arg;

    if (!Id.isValid(id))
      throw new EPP({
        code: "INVALID_PARENT_ID",
        message: `Invalid parentId: "${id}"`,
      });

    const childCategoryRecords = await db.findChildren({ id, recursive });

    const result: ListSubCategories_Result = {
      subCategories: [],
      corruptionError: [],
    };

    for (const categoryInfo of childCategoryRecords)
      try {
        const childCategory = makeCategoryIfNotCorrupted({
          CategoryClass: Category,
          categoryRecord: categoryInfo,
        });

        result.subCategories.push(childCategory);
      } catch (ex: any) {
        result.corruptionError.push(ex);
      }

    return result;
  };
}
