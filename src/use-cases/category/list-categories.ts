import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";

interface MakeListAllCategories_Argument {
  db: Pick<CategoryDatabaseInterface, "findAll">;
}

export default function makeListCategories(
  arg: MakeListAllCategories_Argument
) {
  const { db } = arg;
  return async function listCategories() {
    return await db.findAll();
  };
}
