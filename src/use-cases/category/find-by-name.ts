import { assert } from "handy-types";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

export interface makeFindByName_Argument {
  database: Pick<CategoryDatabaseInterface, "findByName">;
}
export function makeFindByName(
  factoryArg: makeFindByName_Argument
): CategoryServiceInterface["findByName"] {
  const { database } = factoryArg;
  return async function findByName(arg) {
    const name = String(arg.name).trim();
    assert<string>("non_empty_string", name, {
      name: "name",
      code: "INVALID_NAME",
    });

    return database.findByName({ name });
  };
}
