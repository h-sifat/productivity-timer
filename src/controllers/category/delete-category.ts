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
      const { id = required("params.id", "MISSING_ID") } = request.query;

      const deletedCategories = await categoryService.removeCategory({ id });
      return { body: { success: true, data: deletedCategories } };
    } catch (ex) {
      return {
        body: { success: false, error: { message: ex.message, code: ex.code } },
      };
    }
  };
}
