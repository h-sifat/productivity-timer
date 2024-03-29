import type { Controller } from "../interface";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

export interface MakePostCategory_Argument {
  categoryService: Pick<CategoryServiceInterface, "addCategory">;
}

export default function makePostCategory(
  builderArg: MakePostCategory_Argument
): Controller {
  const { categoryService } = builderArg;

  return async function postCategory(request) {
    const categoryInfo = request.body;

    try {
      const category = await categoryService.addCategory({ categoryInfo });
      return { body: { success: true, data: category } };
    } catch (ex) {
      return {
        body: { success: false, error: { message: ex.message, code: ex.code } },
      };
    }
  };
}
