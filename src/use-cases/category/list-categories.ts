import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

interface MakeListAllCategories_Argument {
  db: Pick<CategoryDatabaseInterface, "findAll">;
}

export default function makeListCategories(
  arg: MakeListAllCategories_Argument
): CategoryServiceInterface["listCategories"] {
  const { db } = arg;
  return async function listCategories() {
    return await db.findAll();
  };
}
