import type {
  Edit_Argument,
  CategoryFields,
  MakeCategory_Argument,
} from "entities/category/category";
import CategoryDatabaseInterface, { QueryMethodArguments } from "./category-db";

export interface AddCategory_Argument {
  categoryInfo: MakeCategory_Argument;
}
export interface EditCategory_Argument {
  id: string;
  changes: Edit_Argument["changes"];
}

export interface CategoryServiceInterface {
  getMaxId(): Promise<number>;
  getCategoryById(arg: { id: string }): Promise<CategoryFields | null>;
  listParentCategories(
    arg: QueryMethodArguments["findParentCategories"]
  ): ReturnType<CategoryDatabaseInterface["findParentCategories"]>;
  listSubCategories(
    arg: QueryMethodArguments["findSubCategories"]
  ): Promise<CategoryFields[]>;
  removeCategory(
    arg: QueryMethodArguments["deleteById"]
  ): Promise<CategoryFields[]>;
  addCategory(arg: AddCategory_Argument): Promise<CategoryFields>;
  editCategory(arg: EditCategory_Argument): Promise<CategoryFields>;
  listCategories(): ReturnType<CategoryDatabaseInterface["findAll"]>;
  findByName: CategoryDatabaseInterface["findByName"];
}

export type CategoryDeleteSideEffect = (arg: {
  id: string;
  deleted: CategoryFields[];
}) => Promise<void>;

export type CategoryAddSideEffect = (category: CategoryFields) => void;
export type CategoryEditSideEffect = (arg: {
  original: CategoryFields;
  updated: CategoryFields;
}) => void;
