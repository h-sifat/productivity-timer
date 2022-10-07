import EPP from "common/util/epp";
import { ID } from "common/interfaces/id";
import { CategoryFields } from "entities/category/category";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";

interface MakeRemoveCategory_Argument {
  isValidId: ID["isValid"];
  db: Pick<CategoryDatabaseInterface, "deleteById">;
}

export interface RemoveCategory_Argument {
  id: string;
}

export default function makeRemoveCategory(arg: MakeRemoveCategory_Argument) {
  const { db, isValidId } = arg;
  return async function removeCategory(
    arg: RemoveCategory_Argument
  ): Promise<Readonly<CategoryFields>[]> {
    const { id } = arg;

    if (!isValidId(id)) throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");

    return await db.deleteById({ id });
  };
}
