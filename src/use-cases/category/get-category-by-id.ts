import type { ID } from "common/interfaces/id";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

interface MakeGetCategoryById_Argument {
  isValidId: ID["isValid"];
  db: Pick<CategoryDatabaseInterface, "findById">;
}

export default function makeGetCategoryById(
  builderArg: MakeGetCategoryById_Argument
): CategoryServiceInterface["getCategoryById"] {
  const { isValidId, db } = builderArg;

  return async function getCategoryById(arg) {
    assert("plain_object", arg, {
      code: "INVALID_ARGUMENT_TYPE",
      name: "getCategoryById argument",
    });

    const { id = required("id") } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: ${id}`, "INVALID_ID");
    return await db.findById({ id });
  };
}
