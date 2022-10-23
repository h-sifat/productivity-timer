import required from "common/util/required";

import type { Controller } from "../interface";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

export interface MakeDeleteCategory_Argument {
  categoryService: Pick<CategoryServiceInterface, "removeCategory">;
}

export default function makeDeleteCategory(
  builderArg: MakeDeleteCategory_Argument
): Controller {
  const { categoryService } = builderArg;

  /**
   * **delete** /categories/`:id`
   * */
  return async function deleteCategory(request) {
    try {
      const { id = required("params.id", "MISSING_ID") } = request.params;

      const deletedCategories = await categoryService.removeCategory({ id });
      return { error: null, body: deletedCategories };
    } catch (ex) {
      return { error: { message: ex.message, code: ex.code }, body: {} };
    }
  };
}
