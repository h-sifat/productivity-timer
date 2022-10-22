import getID from "data-access/id";
import makeAddCategory from "./add-category";
import makeEditCategory from "./edit-category";
import makeGetCategoryMaxId from "./get-max-id";
import makeListCategories from "./list-categories";
import makeRemoveCategory from "./remove-category";
import makeGetCategoryById from "./get-category-by-id";
import makeListSubCategories from "./list-sub-categories";
import makeListParentCategories from "./list-parent-categories";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import { CategoryServiceInterface } from "use-cases/interfaces/category-service";

export interface MakeCategoryService_Argument {
  database: CategoryDatabaseInterface;
}

export default function makeCategoryService(
  builderArg: MakeCategoryService_Argument
): CategoryServiceInterface {
  const { database: db } = builderArg;
  const Id = getID({ entity: "category" });
  const isValidId = Id.isValid;

  const categoryService = Object.freeze({
    addCategory: makeAddCategory({ db }),
    getMaxId: makeGetCategoryMaxId({ db }),
    listCategories: makeListCategories({ db }),
    editCategory: makeEditCategory({ db, isValidId }),
    listSubCategories: makeListSubCategories({ db, Id }),
    removeCategory: makeRemoveCategory({ db, isValidId }),
    getCategoryById: makeGetCategoryById({ db, isValidId }),
    listParentCategories: makeListParentCategories({ db, isValidId }),
  });

  return categoryService;
}
