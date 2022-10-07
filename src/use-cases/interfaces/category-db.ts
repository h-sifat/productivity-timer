import { CategoryFields } from "entities/category/category";
import { ProjectFields } from "entities/project/project";

export interface QueryMethodArguments {
  insert: CategoryFields;
  deleteById: { id: string };
  findById: { id: string };
  findByHash: { hash: string };
  findParentCategories: { id: string };
  updateById: { id: string; changes: Partial<ProjectFields> };
  findSubCategories: { parentId: string; recursive?: boolean };
}

export default interface CategoryDatabaseInterface {
  findAll(): Promise<CategoryFields[]>;
  insert(arg: QueryMethodArguments["insert"]): Promise<CategoryFields>;
  deleteById(
    arg: QueryMethodArguments["deleteById"]
  ): Promise<CategoryFields[]>;
  findById(
    arg: QueryMethodArguments["findById"]
  ): Promise<CategoryFields | null>;
  findByHash(
    arg: QueryMethodArguments["findByHash"]
  ): Promise<CategoryFields | null>;
  findParentCategories(
    arg: QueryMethodArguments["findParentCategories"]
  ): Promise<CategoryFields[]>;
  findSubCategories(
    arg: QueryMethodArguments["findSubCategories"]
  ): Promise<CategoryFields[]>;
  updateById(arg: QueryMethodArguments["updateById"]): Promise<CategoryFields>;
}
