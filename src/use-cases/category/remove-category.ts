import EPP from "common/util/epp";
import { ID } from "common/interfaces/id";

import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

interface MakeRemoveCategory_Argument {
  isValidId: ID["isValid"];
  db: Pick<CategoryDatabaseInterface, "deleteById">;
}

export interface RemoveCategory_Argument {
  id: string;
}

export default function makeRemoveCategory(
  builderArg: MakeRemoveCategory_Argument
): CategoryServiceInterface["removeCategory"] {
  const { db, isValidId } = builderArg;

  return async function removeCategory(arg) {
    const { id } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    return await db.deleteById({ id });
  };
}
