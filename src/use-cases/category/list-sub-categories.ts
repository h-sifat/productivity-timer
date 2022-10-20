import type { ID } from "common/interfaces/id";
import type { CategoryFields } from "entities/category/category";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";

import EPP from "common/util/epp";
import { QueryMethodArguments } from "use-cases/interfaces/category-db";

interface MakeListSubCategories_Argument {
  Id: ID;
  db: Pick<CategoryDatabaseInterface, "findSubCategories" | "findById">;
}

export default function makeListSubCategories(
  arg: MakeListSubCategories_Argument
) {
  const { Id, db } = arg;

  return async function listSubCategories(
    arg: QueryMethodArguments["findSubCategories"]
  ): Promise<CategoryFields[]> {
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
