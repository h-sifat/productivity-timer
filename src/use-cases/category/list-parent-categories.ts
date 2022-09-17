import { ID } from "common/interfaces/id";
import EPP from "common/util/epp";
import required from "common/util/required";
import CategoryDatabaseInterface from "use-cases/interfaces/category-db";

interface MakeListParentCategories_Argument {
  isValidId: ID["isValid"];
  db: Pick<CategoryDatabaseInterface, "findById" | "findParentCategories">;
}

export default function makeListParentCategories(
  arg: MakeListParentCategories_Argument
) {
  const { isValidId, db } = arg;

  return async function listParentCategories(arg: { id: string }) {
    const { id = required("id") } = arg;

    if (!isValidId(id))
      throw new EPP(`Invalid category id: ${id}`, "INVALID_ID");

    const category = await db.findById({ id });

    if (!category)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No category exist with id: "${id}"`,
      });

    if (!category.parentId) return [];

    return await db.findParentCategories({ id });
  };
}
