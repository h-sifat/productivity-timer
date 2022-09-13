import type { ID } from "common/interfaces/id";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryFields } from "entities/category/category";

import EPP from "common/util/epp";
import Category from "entities/category";
import required from "common/util/required";

export interface MakeEditCategory_Argument {
  Id: ID;
  getCurrentTimestamp(): number;
  db: Pick<CategoryDatabaseInterface, "findById" | "updateById">;
}

export interface EditCategory_Argument {
  id: string;
  changes: Partial<Omit<CategoryFields, "hash" | "id">>;
}

export default function makeEditCategory(arg: MakeEditCategory_Argument) {
  const { db, Id, getCurrentTimestamp } = arg;

  return async function editCategory(
    arg: EditCategory_Argument
  ): Promise<Readonly<CategoryFields>> {
    if (!("id" in arg)) required("id");
    if (!("changes" in arg)) required("changes");

    const { id, changes } = arg;

    if (!Id.isValid(id)) throw new EPP(`Invalid id: ${id}`, "INVALID_ID");

    const existing = await db.findById({ id });

    if (!existing)
      throw new EPP({
        code: "CATEGORY_DOES_NOT_EXIST",
        message: `No category exist with id: "${id}"`,
      });

    if (changes.parentId) {
      const parent = await db.findById({ id: changes.parentId });

      if (!parent)
        throw new EPP({
          code: "PARENT_DOES_NOT_EXIST",
          message: `No parent category with id: "${changes.parentId}"`,
        });
    }

    {
      // don't change the order of properties
      const updatedCategoryInfo = new Category({
        ...existing,
        ...changes,
        id,
        modifiedOn: getCurrentTimestamp(),
      }).toPlainObject();

      await db.updateById({ id, changes: updatedCategoryInfo });

      return updatedCategoryInfo;
    }
  };
}
