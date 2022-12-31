import type { Controller } from "../interface";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

import required from "common/util/required";

export interface MakePatchCategory_Argument {
  categoryService: Pick<CategoryServiceInterface, "editCategory">;
}

export default function makePatchCategory(
  builderArg: MakePatchCategory_Argument
): Controller {
  const { categoryService } = builderArg;

  /**
   * **patch** categories/`?id=<id>`
   * body: `{changes: {...}}`
   * */
  return async function patchCategory(request) {
    try {
      const { id = required("query.id", "MISSING_ID") } = request.query;
      const { changes = required("body.changes", "MISSING_CHANGES") } =
        request.body;

      const edited = await categoryService.editCategory({ id, changes });
      return { body: { success: true, data: edited } };
    } catch (ex) {
      return {
        body: { success: false, error: { message: ex.message, code: ex.code } },
      };
    }
  };
}
