import type { ID } from "common/interfaces/id";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

import EPP from "common/util/epp";

interface MakeListSubCategories_Argument {
  Id: ID;
  db: Pick<CategoryDatabaseInterface, "findSubCategories" | "findById">;
}

export default function makeListSubCategories(
  builderArg: MakeListSubCategories_Argument
): CategoryServiceInterface["listSubCategories"] {
  const { Id, db } = builderArg;

  return async function listSubCategories(arg) {
    const { parentId } = arg;

    if (!Id.isValid(parentId))
      throw new EPP({
        code: "INVALID_PARENT_ID",
        message: `Invalid parentId: "${parentId}"`,
      });

    {
      const parent = await db.findById({ id: parentId });
      if (!parent)
        throw new EPP({
          code: "PARENT_NOT_FOUND",
          message: `No category found with the id: "${parentId}".`,
        });
    }

    return await db.findSubCategories({ parentId });
  };
}
