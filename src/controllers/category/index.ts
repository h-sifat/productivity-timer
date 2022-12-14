import type { CategoryControllerInterface } from "./interface";
import type { CategoryServiceInterface } from "use-cases/interfaces/category-service";

import makePostCategory from "./post-category";
import makeGetCategories from "./get-categories";
import makePatchCategory from "./patch-category";
import makeDeleteCategory from "./delete-category";

export interface MakeCategoryController_Argument {
  categoryService: CategoryServiceInterface;
}

export default function makeCategoryController(
  builderArg: MakeCategoryController_Argument
): CategoryControllerInterface {
  const categoryController = Object.freeze({
    get: makeGetCategories(builderArg),
    post: makePostCategory(builderArg),
    patch: makePatchCategory(builderArg),
    delete: makeDeleteCategory(builderArg),
  });

  return categoryController;
}
