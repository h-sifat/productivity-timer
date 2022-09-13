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

export default function makeRemoveCategories(arg: MakeRemoveCategory_Argument) {
  const { db, isValidId } = arg;
  return async function removeCategories(
    arg: RemoveCategory_Argument
  ): Promise<Readonly<CategoryFields>[]> {
    const { id, removeChildrenRecursively = false } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    const categoryRecord = await db.findById({ id });

    if (!categoryRecord)
      throw new EPP({
        code: "CATEGORY_DOES_NOT_EXIST",
        message: `No category exists with id: "${id}"`,
      });

    const subCategoryRecords = await db.findSubCategories({
      id,
      recursive: true,
    });

    if (subCategoryRecords.length && removeChildrenRecursively === false)
      throw new EPP({
        code: "CATEGORY_HAS_CHILDREN",
        message: `Category with id: "${id}" can't be removed because it has children.`,
      });

    const categoryIdsToDelete = [categoryRecord, ...subCategoryRecords].map(
      (record) => record.id
    );

    {
      const deletedCategories = await db.deleteMany({
        ids: categoryIdsToDelete,
      });

      return deletedCategories.map((category) => Object.freeze(category));
    }
  };
}
