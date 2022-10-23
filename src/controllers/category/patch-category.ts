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
   * **patch** categories/`:id`
   * body: `{changes: {...}}`
   * */
  return async function patchCategory(request) {
    try {
      const { id = required("params.id", "MISSING_ID") } = request.params;
      const { changes = required("body.changes", "MISSING_CHANGES") } =
        request.body;

      const edited = await categoryService.editCategory({ id, changes });
      return { error: null, body: edited };
    } catch (ex) {
      return { error: { message: ex.message, code: ex.code }, body: {} };
    }
  };
}
