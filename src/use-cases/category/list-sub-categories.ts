import type { ID } from "common/interfaces/id";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { MakeCategoryIfNotCorrupted } from "use-cases/interfaces/category-util";
import type { CategoryFields } from "entities/category/category";

import EPP from "common/util/epp";
import Category from "entities/category";

interface MakeListSubCategories_Argument {
  Id: ID;
  db: Pick<CategoryDatabaseInterface, "findSubCategories">;
  makeCategoryIfNotCorrupted: MakeCategoryIfNotCorrupted;
}

interface ListSubCategories_Argument {
  id: string;
  recursive?: boolean;
}

interface ListSubCategories_Result {
  corruptionError: EPP[];
  subCategories: Readonly<CategoryFields>[];
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

    const childCategoryRecords = await db.findSubCategories({ id, recursive });

    const result: ListSubCategories_Result = {
      subCategories: [],
      corruptionError: [],
    };

    for (const categoryInfo of childCategoryRecords)
      try {
        const childCategory = makeCategoryIfNotCorrupted({
          CategoryClass: Category,
          categoryRecord: categoryInfo,
        }).toPlainObject();

        result.subCategories.push(childCategory);
      } catch (ex: any) {
        result.corruptionError.push(ex);
      }

    return result;
  };
}