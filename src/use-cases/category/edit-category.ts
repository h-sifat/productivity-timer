import type { ID } from "common/interfaces/id";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryFields, Edit_Argument } from "entities/category/category";

import EPP from "common/util/epp";
import Category from "entities/category";
import required from "common/util/required";
import { FIELDS_ALLOWED_TO_CHANGE } from "entities/category/category";

export interface MakeEditCategory_Argument {
  isValidId: ID["isValid"];
  db: Pick<CategoryDatabaseInterface, "findById" | "updateById">;
}

export interface EditCategory_Argument {
  id: string;
  changes: Edit_Argument["changes"];
}

export default function makeEditCategory(arg: MakeEditCategory_Argument) {
  const { db, isValidId } = arg;

  return async function editCategory(
    arg: EditCategory_Argument
  ): Promise<Readonly<CategoryFields>> {
    const { id = required("id"), changes = required("changes") } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: ${id}`, "INVALID_ID");

    const category = await db.findById({ id });

    if (!category)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No category exist with id: "${id}"`,
      });

    if (changes.parentId) {
      const parent = await db.findById({ id: changes.parentId });

      if (!parent)
        throw new EPP({
          code: "PARENT_NOT_FOUND",
          message: `No parent category exists with id: "${changes.parentId}"`,
        });
    }

    {
      const filteredChanges: Edit_Argument["changes"] = {};

      for (const property of FIELDS_ALLOWED_TO_CHANGE)
        if (property in changes)
          // @ts-expect-error ugh! readonly props
          filteredChanges[property] = changes[property];

      const editedCategory = Category.edit({
        category,
        changes: filteredChanges,
      });

      await db.updateById({ id, edited: editedCategory });

      return editedCategory;
    }
  };
}
