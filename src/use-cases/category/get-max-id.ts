import CategoryDatabaseInterface from "use-cases/interfaces/category-db";

interface MakeGetCategoryMaxId_Argument {
  db: Pick<CategoryDatabaseInterface, "getMaxId">;
}
export default function makeGetCategoryMaxId(
  builderArg: MakeGetCategoryMaxId_Argument
) {
  const { db } = builderArg;

  return async function getMaxId(): Promise<number> {
    return await db.getMaxId();
  };
}
