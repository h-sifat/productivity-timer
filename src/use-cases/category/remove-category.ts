import type {
  CategoryDeleteSideEffect,
  CategoryServiceInterface,
} from "use-cases/interfaces/category-service";
import type { ID } from "common/interfaces/id";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

interface MakeRemoveCategory_Argument {
  isValidId: ID["isValid"];
  db: Pick<CategoryDatabaseInterface, "deleteById">;
  sideEffect: CategoryDeleteSideEffect;
}

export interface RemoveCategory_Argument {
  id: string;
}

export default function makeRemoveCategory(
  builderArg: MakeRemoveCategory_Argument
): CategoryServiceInterface["removeCategory"] {
  const { db, isValidId, sideEffect } = builderArg;

  return async function removeCategory(arg) {
    assert("plain_object", arg, {
      code: "INVALID_ARGUMENT_TYPE",
      name: "RemoveCategory argument",
    });

    const { id = required("id") } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    const deletedCategories = await db.deleteById({ id });
    await sideEffect({ id, deleted: deletedCategories });
    return deletedCategories;
  };
}
