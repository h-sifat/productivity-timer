import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

interface MakeGetCategoryMaxId_Argument {
  db: Pick<CategoryDatabaseInterface, "getMaxId">;
}
export default function makeGetCategoryMaxId(
  builderArg: MakeGetCategoryMaxId_Argument
): CategoryServiceInterface["getMaxId"] {
  const { db } = builderArg;

  return async function getMaxId(): Promise<number> {
    return await db.getMaxId();
  };
}
