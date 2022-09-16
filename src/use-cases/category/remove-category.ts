import EPP from "common/util/epp";
import { ID } from "common/interfaces/id";
import { CategoryFields } from "entities/category/category";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";

interface MakeRemoveCategory_Argument {
  isValidId: ID["isValid"];
  db: Pick<
    CategoryDatabaseInterface,
    "findById" | "findSubCategories" | "deleteMany"
  >;
}

export interface RemoveCategory_Argument {
  id: string;
  removeChildrenRecursively?: boolean;
}

export default function makeRemoveCategory(arg: MakeRemoveCategory_Argument) {
  const { db, isValidId } = arg;
  return async function removeCategory(
    arg: RemoveCategory_Argument
  ): Promise<Readonly<CategoryFields>[]> {
    const { id, removeChildrenRecursively = false } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    const category = await db.findById({ id });

    if (!category)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No category exists with the id: "${id}"`,
      });

    const subCategories = await db.findSubCategories({
      parentId: id,
      recursive: true,
    });

    if (subCategories.length && removeChildrenRecursively === false)
      throw new EPP({
        code: "CATEGORY_HAS_CHILDREN",
        message: `Category with id: "${id}" can't be removed because it has children.`,
      });

    {
      const ids = [category, ...subCategories].map(({ id }) => id);
      return await db.deleteMany({ ids });
    }
  };
}
