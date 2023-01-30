import getID from "data-access/id";
import makeAddCategory from "./add-category";
import makeEditCategory from "./edit-category";
import makeGetCategoryMaxId from "./get-max-id";
import { makeFindByName } from "./find-by-name";
import makeListCategories from "./list-categories";
import makeRemoveCategory from "./remove-category";
import makeGetCategoryById from "./get-category-by-id";
import makeListSubCategories from "./list-sub-categories";
import makeListParentCategories from "./list-parent-categories";

import type {
  CategoryAddSideEffect,
  CategoryEditSideEffect,
  CategoryDeleteSideEffect,
  CategoryServiceInterface,
} from "use-cases/interfaces/category-service";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";

export interface MakeCategoryService_Argument {
  database: CategoryDatabaseInterface;
  deleteSideEffect: CategoryDeleteSideEffect;
  postSideEffect?: CategoryAddSideEffect | undefined;
  patchSideEffect?: CategoryEditSideEffect | undefined;
}

export default function makeCategoryService(
  builderArg: MakeCategoryService_Argument
): CategoryServiceInterface {
  const {
    database: db,
    postSideEffect,
    patchSideEffect,
    deleteSideEffect,
  } = builderArg;
  const Id = getID({ entity: "category" });
  const isValidId = Id.isValid;

  const categoryService = Object.freeze({
    removeCategory: makeRemoveCategory({
      db,
      isValidId,
      sideEffect: deleteSideEffect,
    }),
    editCategory: makeEditCategory({
      db,
      isValidId,
      sideEffect: patchSideEffect,
    }),

    getMaxId: makeGetCategoryMaxId({ db }),
    listCategories: makeListCategories({ db }),
    findByName: makeFindByName({ database: db }),
    getCategoryById: makeGetCategoryById({ db, isValidId }),
    listSubCategories: makeListSubCategories({ db, isValidId }),
    addCategory: makeAddCategory({ db, sideEffect: postSideEffect }),
    listParentCategories: makeListParentCategories({ db, isValidId }),
  });

  return categoryService;
}
